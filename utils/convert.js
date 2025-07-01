function convertJson(input) {
  return {
    fileurl: input.inputPath,
    mediaObj: {
      enableVtt: true,
      media_properties: {
        format: {
          format_name: "hls"
        },
        programs: input.profiles.map((profile, index) => ({
          tags: {
            variant_bitrate: parseInt(profile.bitrate) * 8 // bitrate in bps
          },
          streams: [
            {
              index: index * 2,
              codec_name: profile.codec,
              profile: profile.profile,
              codec_type: "video",
              width: parseInt(profile.resolution.split('x')[0]),
              height: parseInt(profile.resolution.split('x')[1]),
              r_frame_rate: `${profile.fps}/1`,
              pix_fmt: profile.pix_fmt,
              level: parseFloat(profile.level) * 10,
              tags: {
                variant_bitrate: parseInt(profile.bitrate) * 8
              }
            },
            {
              index: index * 2 + 1,
              codec_name: input.audio_codec,
              sample_rate: input.audio_rate,
              codec_type: "audio",
              tags: {
                variant_bitrate: parseInt(input.audio_bitrate) * 8
              }
            }
          ]
        }))
      }
    },
    segmentLen: parseInt(input.hls_time),
    isSlate: false,
    isSeparateAudio: false,
    adUnitObj: {}, 
    transcodeDir: input.output_folder + '/',
    transcodedFile: input.sessionId,
    isHeAacArr: input.audio_profile === 'aac_he',
    contentType: '',
    enableAdVolume: input.adVolume !== undefined,
    adVolume: parseFloat(input.adVolume),
    enableSlateAudio: input.adVolume !== undefined,
    enableVtt: true,
    maxAdRes: Math.max(...input.profiles.map(p => parseInt(p.resolution.split('x')[0]))),
    preset: input.preset,
    isFragmented: false,
    profilePresent: {
      video: true,
      audio: true
    },
    textOverlay: {
      enable: false
    },
    forceOriginalRatio: "decrease"
  };
}

module.exports = convertJson;