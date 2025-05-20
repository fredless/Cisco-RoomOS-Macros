// Copyright (C) 2022 Frederick W. Nielsen
// 
// This file is part of Cisco-RoomOS-Macros.
// 
// Cisco-RoomOS-Macros is free software: you can redistribute it and/or modify
// it under the terms of the GNU General Public License as published by
// the Free Software Foundation, either version 3 of the License, or
// (at your option) any later version.
// 
// Cisco-RoomOS-Macros is distributed in the hope that it will be useful,
// but WITHOUT ANY WARRANTY; without even the implied warranty of
// MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
// GNU General Public License for more details.
// 
// You should have received a copy of the GNU General Public License
// along with Cisco-RoomOS-Macros.  If not, see <http://www.gnu.org/licenses/>.

const xapi = require('xapi');

const webexMsgUrl = 'https://webexapis.com/v1/messages';

// diagnostic Webex space
const roomId = 'base64 roomId here';
// automation bot token
const token = 'bot auth token here';
// number of seconds for OSD alert to display
const alertTime = 180

const headers = ['Content-Type: application/json', 'Authorization: Bearer ' + token];

function clearAlert() {
    xapi.Command.UserInterface.Message.Alert.Clear();
}

function setAlert(status, date) {
    xapi.Command.UserInterface.Message.Alert.Display({Text: date, Title: status, Duration: alertTime});
}

function logWxMsg(status, date) {
    // Log space msg
    if (status == "Inactive") {
      //In case of fully failed registration, put emphasis on log message and send logs for troubleshooting
      var mdTreatment='#'
      xapi.Command.Logging.SendLogs();
      }
    else {var mdTreatment = '  '}

    (async() => {
        Promise.all([
            xapi.Config.SIP.DisplayName.get(),
            xapi.Status.SystemUnit.ProductId.get(),
            xapi.Status.Network[1].Ethernet.MacAddress.get(),
            xapi.Status.SIP.Proxy[1].Address.get()
        ])
        .then(([displayName, deviceModel, macAddress, proxy]) => {
            var markdown = `\`${mdTreatment} ${date} ${displayName.padEnd(25)} ${deviceModel.padEnd(23)} ${macAddress.padEnd(20)} ${proxy.padEnd(21)} ${status.padEnd(10)} ${mdTreatment}\``;
            xapi.Command.HttpClient.Post({Header: headers, Url: webexMsgUrl}, JSON.stringify(Object.assign({markdown}, {roomId})));
        })
      })()
}

function regChange(status) {
    console.log(status);
    var date = new Date().toString().split('.').shift();
    switch (status) {
        case 'Registered':
            clearAlert();
            logWxMsg(status, date);
            break;
        case 'Deregister':
        case 'Failed':
        case 'Inactive':
            // endpoint registration (and re-registration) has fully failed at this point
            setAlert(status, date);
            logWxMsg(status, date);
            break;
    }
}

// startup - clear any old alerts and ensure http client is available
xapi.Command.UserInterface.Message.Alert.Clear();
xapi.Config.HttpClient.Mode.set('On');

console.log('waiting 120 seconds for registration to settle at boot..')
setTimeout(function () {
  console.log('..now listening to registration changes');
  xapi.Status.SIP.Registration.Status.on(regChange);
}, 120000);