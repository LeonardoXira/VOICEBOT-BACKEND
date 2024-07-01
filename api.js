const axios = require('axios');

const postNewCall = async (callId, campaign, phoneNumber, extraInfo) => {
  try {
    const { data: resp } = await axios.post('https://ptf-voice-genesys.xira.app/api/v1/newCall', {
      callId,
      campaign,
      phoneNumber,
      extraInfo
    });

    return resp;
  } catch (error) {
    console.error(error.response.data);
  }
}

const postCall = async (callId, campaign, phoneNumber, audio64) => {
  try {
    console.log(callId, campaign, phoneNumber, audio64.substring(0, 10))
    const resp = await axios.post('https://ptf-voice-genesys.xira.app/api/v1/call', {
      callId,
      phoneNumber,
      campaign,
      audio64
    });
    return resp.data;
  } catch (error) {
    console.error('Error: ', error.response);
  }
}

module.exports = {
  postNewCall,
  postCall
}
