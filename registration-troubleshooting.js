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
const headers = ['Content-Type: application/json', 'Authorization: Bearer ' + token];
// number of seconds for OSD alert to display
const alertTime = 180

function sendWxMsg(markdown) {
  let body = Object.assign({markdown}, {roomId});
  xapi.Command.HttpClient.Post({Header: headers, Url: webexMsgUrl}, JSON.stringify(body));
}

function regChange(status) {
    console.log(status);
    (async() => {
        Promise.all([
              xapi.Config.SIP.DisplayName.get(),
              xapi.Status.SystemUnit.ProductId.get(),
              xapi.Status.Network[1].Ethernet.MacAddress.get()
        ])
          .then(([displayName, deviceModel, macAddress]) => {
            switch (status) {
            case 'Inactive':
              // endpoint registration (and re-registration) has fully failed at this point
              let date = new Date().toString().split('.').shift();
              // display OSD alert
              xapi.Command.UserInterface.Message.Alert.Display({
                Text: date,
                Title: "Endpoint registration failure",
                Duration: alertTime
              });
              sendWxMsg(`**${displayName} (${deviceModel}-${macAddress}) registration failure, sending logs**`);
              xapi.Command.Logging.SendLogs();
              break;
            case 'Registered':
              // Endpoint successfully registered, clear OSD alert if present
              xapi.Command.UserInterface.Message.Alert.Clear();
              sendWxMsg(`${displayName} (${deviceModel}-${macAddress}) registered`);
            }
          })  
    })()
}

// startup - clear old alerts and ensure http client is available
xapi.Command.UserInterface.Message.Alert.Clear();
xapi.Config.HttpClient.Mode.set('On');

console.log('waiting 120 seconds for registration to settle at boot..')
setTimeout(function () {
  console.log('..now listening to registration changes')
  xapi.Status.SIP.Registration.Status.on(regChange);
}, 120000); 