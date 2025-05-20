import xapi from 'xapi';

const inputConnectorId                      = 3;                                 // HDMI input connector number
const panelId                               = 'resolution_toggle';               // PanelId of your action panel button
const [lowResolution, highResolution]       = ['1920_1080_60', '3840_2160_60'];  // resolution toggle values
const [nextActionHighRes, nextActionLowRes] = ['Input 4K', 'Input 1080p'];       // "Next" action panel title toggle values

const objectMaxResolution                   = xapi.Config.Video.Input.Connector[inputConnectorId].MaxResolution;

async function toggleResolution() {
  try {
    // Get current input max resolution
    const current_res = (await objectMaxResolution.get());
    // Decide which toggle value pair to set
    const [new_res, panel_label] = (current_res === lowResolution) ? [highResolution, nextActionLowRes] : [lowResolution, nextActionHighRes];

    // Set max resolution and update panel label
    objectMaxResolution.set(new_res);
    xapi.Command.UserInterface.Extensions.Panel.Update({PanelId : panelId, Name : panel_label});

    console.log(`✅ Input ${inputConnectorId}: MaxResolution changed from ${current_res} -> ${new_res}`);
  }
  catch (err) {
    console.error('⚠️ Failed to toggle resolution:', err);
  }
}

// Listen for the Action Button press
xapi.Event.UserInterface.Extensions.Panel.Clicked.on((event) => {toggleResolution()}, {PanelId: panelId});

console.log(`🟢 Input ${inputConnectorId} max resolution toggle macro loaded, listening for ${panelId} events`);