# Actions on Google: Gnome Garden Game

**NOTE**

This is an experimental project and will receive minimal maintenance. Only bugs for security issues will be accepted. No feature requests will be accepted. Pull requests will be acknowledged and reviewed as soon as possible. There is no associated SLAs.

Some of the projects in this experimental org might mature to a more stable state and move into the main [Actions on Google GitHub org](https://github.com/actions-on-google).

---
![Gnome Garden](/public/assets/images/gnomegarden.gif?raw=true "Gnome Garden")

This is the full source code for the Google Assistant game, [Gnome Garden](https://assistant.google.com/services/invoke/uid/000000a633941f7b?hl=en).

Plant your own garden with the help of your voice & your trusty garden gnome, G’norman.

G'norman is a curious gnome. Answer his whimsical ponderings, and he’ll sculpt what you say into a beautiful garden. Make sure to check on your garden (and G’norman) often before those pesky weeds (or beautiful wildflowers, whichever your POV) take over!

When it's all full, keep the zen garden by your side as you go about your activities, or delight in a new one if you fancy a daily change of scenery.

This game explores a new, experimental type of gameplay, offered by the ambient nature of smart displays in the home. We hope this game and the design process that we followed inspires you to create your own unique, ambient experiences.

This game has been designed for Nest Hub and Nest Hub Max smart displays and implemented using [Interactive Canvas](https://developers.google.com/assistant/interactivecanvas).

### Prerequisites
1. Node.js and NPM
    + We recommend installing using [nvm for Linux/Mac](https://github.com/creationix/nvm) and [nvm-windows for Windows](https://github.com/coreybutler/nvm-windows)
1. Install the [Firebase CLI](https://firebase.google.com/docs/cli)
    + We recommend using MAJOR version `8` with `8.3.0` or above, `npm install -g firebase-tools@^8.3.0`
    + Run `firebase login` with your Google account
1. For Windows developers, the projects scripts rely on a bash script, so we recommend installing Ubuntu on Windows Subsystem for Linux.

### Setup
#### Actions Console
1. From the [Actions on Google Console](https://console.actions.google.com/), **New project** > **Create project** > **Game** > **Blank Project for Smart Display**
1. Enable the `For Families` option under  **Deploy** > **Directory information** > **Additional information** and save the information.

#### Firebase Deployment
1. On your local machine, in the root directory of the project, run `npm install`.
1. Run `npm install` in the `functions` directory.
1. Run `firebase use --add {PROJECT_ID}` in the project root directory.
1. Edit .env and and replace `{PROJECT_ID}` with your project ID and replace `{Game Name}` your own name.
1. Run `npm run deploy`.

#### Actions CLI
1. Install the [Actions CLI](https://developers.google.com/assistant/actionssdk/gactions)
1. Navigate to `sdk/settings/settings.yaml`, and replace `{PROJECT_ID}` with your project ID.
1. Navigate to `sdk/settings/en/settings.yaml`, and replace `{Game Name}` your own name.
1. Navigate to `sdk/webhook/AssistantStudioFulfillment.yaml`, and replace `{PROJECT_ID}` with your project ID
1. Navigate to the `sdk/` directory by running `cd sdk` from the root directory of this project.
1. Run `gactions login` to login to your account.
1. Run `gactions push` to push the whole project.
1. Run `gactions deploy preview` to deploy the project.

### Running this Sample
+ You can test your Action on any Google Assistant-enabled device on which the Assistant is signed into the same account used to create this project. Just say or type, “OK Google, talk to my test app”.
+ You can also use the Actions on Google Console simulator to test most features and preview on-device behavior.

## References & Issues
+ Questions? Go to [StackOverflow](https://stackoverflow.com/questions/tagged/actions-on-google) or the [Assistant Developer Community on Reddit](https://www.reddit.com/r/GoogleAssistantDev/).
+ For bugs, please report an issue on Github.
+ Actions on Google [Documentation](https://developers.google.com/assistant)
+ Actions on Google [Codelabs](https://codelabs.developers.google.com/?cat=Assistant)

## Contributing
Please read and follow the steps in the [CONTRIBUTING.md](CONTRIBUTING.md).

## License
See [LICENSE](LICENSE).
