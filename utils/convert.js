function convertJson(input) {
  return {
    // fileurl
    mediaObj: {
      enableVtt: true,//defult
      media_properties: {

        programs: input.profiles.map(profile => ({
          tags: {
            
          },
          codec_name: input.audio_codec
          // "profile": "LC",

        }))

      }
    }

    // ...input,
    // converted: true,
    // timestamp: new Date().toISOString()
  };
}

module.exports = convertJson;