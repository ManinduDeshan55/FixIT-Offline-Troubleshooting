// Explicit, offline symptom-to-guide rules. Each guide ID must exist in guides.json.
export default [
  { categoryId: 'internet_wifi', symptom: "My computer won't connect to Wi-Fi", guideId: 'wifi_cannot_connect' },
  { categoryId: 'internet_wifi', symptom: 'Wi-Fi connects, but websites won’t load', guideId: 'wifi_connected_no_internet' },
  { categoryId: 'performance', symptom: 'My computer is generally slow', guideId: 'computer_running_slowly' },
  { categoryId: 'performance', symptom: 'My computer takes a long time to start', guideId: 'computer_slow_startup' },
  { categoryId: 'performance', symptom: 'My main drive is nearly full', guideId: 'computer_low_storage' },
  { categoryId: 'audio_sound', symptom: "There's no sound from my computer", guideId: 'audio_no_sound' },
  { categoryId: 'audio_sound', symptom: "My microphone isn't working", guideId: 'audio_microphone_not_working' },
  { categoryId: 'storage_usb', symptom: "My USB drive isn't showing up", guideId: 'usb_drive_not_recognized' },
  { categoryId: 'hardware_devices', symptom: "My keyboard won't type", guideId: 'keyboard_not_typing' },
];
