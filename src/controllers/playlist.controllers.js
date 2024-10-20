import mongoose, { isValidObjectId } from "mongoose";
import { Playlist } from "../models/playlist.models.js";
import { ApiError } from "../utils/ApiError.js";
import { ApiResponse } from "../utils/ApiRespone.js";
import { asyncHandler } from "../utils/asyncHandler.js";
import { PlaylistVideo } from "../models/playlistVideo.models.js";

const createPlaylist = asyncHandler(async (req, res) => {
  const { name, description } = req.body;

  if (!name) {
    throw ApiError(407, "Add Some Name to Playlist");
  }

  const playlistInstance = await Playlist.create({
    name,
    description,
    owner: req?.user?._id,
  });

  if (!playlistInstance) {
    throw ApiError(406, "Playlist Not Created");
  }

  return res
    .status(201)
    .json(new ApiResponse(201, playlistInstance, "Playlist Created"));
});

// getting user playlists
const getUserPlaylists = asyncHandler(async (req, res) => {
  const { userId } = req.params;

  if (!userId || !isValidObjectId(userId)) {
    throw new ApiError(407, "Error In User Identification ");
  }

  /*
getUserPlaylist

1. match with user id owner of the playlist
2. lookup to the playlistVideo to get the videos
    2.1 lookup to the video to get the details of the video
    2.2 add feild of videos within video
    2.3 project the videos
3. add the feild of TotalVideos to the playlist
4. Project the playlist

*/

  const playlistInstance = await Playlist.aggregate([
    {
      $match: {
        owner: mongoose.Types.ObjectId(userId),
      },
    },
    {
      $lookup: {
        from: "playlistvideos",
        localField: "_id",
        foreignField: "playlistId",
        as: "videos",
        pipeline: [
          {
            $lookup: {
              from: "videos",
              localField: "videoId",
              foreignField: "_id",
              as: "video",
              pipeline: [
                {
                  $project: {
                    _id: 1,
                    thumbnail: 1,
                  },
                },
              ],
            },
          },
          {
            $addFields: {
              video: {
                $arrayElemAt: ["$video", 0],
              },
            },
          },
          {
            $project: {
              video: 1,
              createdAt: 1,
              _id: 0,
            },
          },
          {
            $sort: {
              createdAt: -1,
            },
          },
        ],
      },
    },
    {
      $addFields: {
        TotalVideos: {
          $arrayElemAt: ["$videos", 0],
        },
      },
    },
    {
      $project: {
        name: 1,
        description: 1,
        videos: 1,
        TotalVideos: 1,
        _id: 0,
      },
    },
  ]);

  if (!playlistInstance) {
    throw new ApiError(404, "Playlist Not Found");
  }

  return res
    .status(200)
    .json(new ApiResponse(200, playlistInstance, "Playlist Found"));
});

const getPlaylistById = asyncHandler(async (req, res) => {
  const { playlistId } = req.params;

  if (!playlistId || !isValidObjectId(playlistId)) {
    throw new ApiError(407, "Error In Playlist Identification ");
  }

  const playlistInstance = await Playlist.findById(playlistId);

  if (!playlistInstance) {
    throw new ApiError(404, "Playlist Not Found");
  }

  /*
1. match the playlist id
2. lookup to the playlistVideo to get the videos
    2.1 lookup to the video to get the details of the video
    2.2 lookup to the user to get the details of the owner
    2.3 add the owner field to the video details
3. add the videos to the playlist   
4. lookup to the user to get the details of the owner
5. add the owner field to the playlist
*/

  const playListAggregate = await Playlist.aggregate([
    {
      $match: {
        _id: mongoose.Types.ObjectId(playlistId),
      },
    },
    {
      $lookup: {
        from: "playlistvideos",
        localField: "_id",
        foreignField: "playlist",
        as: "videos",
        pipeline: [
          {
            $lookup: {
              from: "videos",
              localField: "videoId",
              foreignField: "_id",
              as: "video",
              pipeline: [
                {
                  $lookup: {
                    from: "users",
                    localField: "owner",
                    foreignField: "_id",
                    as: "owner",
                    pipeline: [
                      {
                        $project: {
                          _id: 1,
                          username: 1,
                          fullName: 1,
                          avatar: 1,
                        },
                      },
                    ],
                  },
                },
                {
                  $addFields: {
                    owner: {
                      $first: "$owner",
                    },
                  },
                },
                {
                  $project: {
                    _id: 1,
                    owner: 1,
                    thumbnail: 1,
                    title: 1,
                    createdAt: 1,
                    duration: 1,
                    views: 1,
                  },
                },
              ],
            },
          },
          {
            $addFields: {
              video: {
                $first: "$video",
              },
            },
          },
          {
            $project: {
              _id: 1,
              video: 1,
              createdAt: 1,
            },
          },
          {
            $sort: {
              createdAt: -1,
            },
          },
        ],
      },
    },
    {
      $lookup: {
        from: "users",
        localField: "owner",
        foreignField: "_id",
        as: "owner",
        pipeline: [
          {
            $project: {
              _id: 1,
              username: 1,
              fullName: 1,
              avatar: 1,
            },
          },
        ],
      },
    },
    {
      $addFields: {
        owner: {
          $first: "$owner",
        },
      },
    },
  ]);

  return res
    .status(200)
    .json(new ApiResponse(200, playListAggregate, "Playlist Found"));
});

// adding video to playlist
const addVideoToPlaylist = asyncHandler(async (req, res) => {
  const { playlistId, videoId } = req.params;

  if (!playlistId || !isValidObjectId(playlistId)) {
    throw new ApiError(407, "Error In Playlist Identification ");
  }

  if (!videoId || !isValidObjectId(videoId)) {
    throw new ApiError(407, "Error In Video Identification ");
  }

  const playlistInstance = await Playlist.findById(playlistId);
  const VideoInstance = await Video.findById(videoId);

  if (!playlistInstance) {
    throw new ApiError(404, "Playlist Not Found");
  }
  if (!VideoInstance) {
    throw new ApiError(404, "Video Not Found");
  }
  // only owner can add video to playlist
  if (playlistInstance.owner.toString() !== req.user._id.toString()) {
    throw new ApiError(
      403,
      "You are not allowed to add video to this playlist"
    );
  }

  // According New PlaylistVideo Schema
  const newPlaylistVideo = await PlaylistVideo.create({
    playlist: playlistId,
    video: videoId,
  });

  if (!newPlaylistVideo) {
    throw new ApiError(406, "Video Not Added To Playlist");
  }

  return res
    .status(200)
    .json(new ApiResponse(200, playlistId, "Video Added To Playlist"));
});

// delete video from playlist
const removeVideoFromPlaylist = asyncHandler(async (req, res) => {
  const { playlistId, videoId } = req.params;

  if (!playlistId || !isValidObjectId(playlistId)) {
    throw new ApiError(407, "Error In Playlist Identification ");
  }
  if (!videoId || !isValidObjectId(videoId)) {
    throw new ApiError(407, "Error In Video Identification ");
  }

  const playlistInstance = await Playlist.findById(playlistId);
  const VideoInstance = await Video.findById(videoId);

  if (!playlistInstance) {
    throw new ApiError(404, "Playlist Not Found");
  }
  if (!VideoInstance) {
    throw new ApiError(404, "Video Not Found");
  }

  // only owner can add video to playlist
  if (playlistInstance.owner.toString() !== req.user._id.toString()) {
    throw new ApiError(
      403,
      "You are not allowed to add video to this playlist"
    );
  }

  await PlaylistVideo.deleteMany({
    playlist: playlistId,
    video: videoId,
  });

  const updatedPlaylist = await Playlist.findById(playlistId);

  if (!updatedPlaylist) {
    throw new ApiError(404, "Playlist Not Found");
  }

  return res
    .status(200)
    .json(new ApiResponse(200, updatedPlaylist, "Video Removed From Playlist"));
});

// delete playlist
const deletePlaylist = asyncHandler(async (req, res) => {
  const { playlistId } = req.params;

  if (!playlistId || !isValidObjectId(playlistId)) {
    throw new ApiError(407, "Error In Playlist Identification ");
  }

  const playlistInstance = await Playlist.findById(playlistId);

  if (!playlistInstance) {
    throw new ApiError(404, "Playlist Not Found");
  }

  if (playlistInstance.owner.toString() !== req.user._id.toString()) {
    throw new ApiError(403, "You are not allowed to delete this playlist");
  }

  const deletedPlaylist = await Playlist.findByIdAndDelete(playlistId);

  if (!deletedPlaylist) {
    throw new ApiError(406, "Playlist Not Deleted");
  }

  return res
    .status(200)
    .json(new ApiResponse(200, deletedPlaylist, "Playlist Deleted"));
});

// update playlist
const updatePlaylist = asyncHandler(async (req, res) => {
  const { playlistId } = req.params;
  const { name, description } = req.body;

  if (!playlistId || !isValidObjectId(playlistId)) {
    throw new ApiError(407, "Error In Playlist Identification ");
  }

  const playlistInstance = await Playlist.findById(playlistId);

  if (!playlistInstance) {
    throw new ApiError(404, "Playlist Not Found");
  }

  if (!name || !description) {
    throw new ApiError(409, "There no change detected");
  }

  const updatedPlaylist = await Playlist.findByIdAndUpdate(
    playlistId,
    {
      $or: [
        {
          name,
        },
        {
          description,
        },
      ],
    },
    {
      new: true,
    }
  );

  if (!updatedPlaylist) {
    throw new ApiError(406, "Playlist Not Updated");
  }

  return res
    .status(200)
    .json(new ApiResponse(200, updatedPlaylist, "Playlist Updated"));
});

export {
  createPlaylist,
  getUserPlaylists,
  getPlaylistById,
  addVideoToPlaylist,
  removeVideoFromPlaylist,
  deletePlaylist,
  updatePlaylist,
};
