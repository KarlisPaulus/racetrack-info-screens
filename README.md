# **Racetrack**

## Table of contents
🤔 [What is it and what does it do?](#what-is-it-and-what-does-it-do)<br/>
❓ [How does it work?](#how-does-it-work)<br/>
⚙️ [How to use the tool yourself?](#how-to-use-the-tool-yourself)<br/>
🤓 [User guide](#user-guide)<br/>
🤝 [Creators](#creators)

## What is it and what does it do?

A **real-time race control system** that allows:
- Role-based access to three interfaces:
	* Front Desk: Creates, modifies and deletes Race sessions and drivers.
	* Race Control: Starts race sessions and manages race modes.
	* Lap Line Tracker: Record lap times.
- 4 Info screens:
	* Leader board: Displays the various lap times of racers in a race session.
	* Next Race: Shows the information of the next upcoming race.
	* Race Countdown: Displays time until current race ends.
	* Race Flag: Displays flag of the current race mode.

- Real-time updates using Socket.io.
- Role-based access (Receptionist/Safety/Observer)
- Mobile-friendly interfaces
- Live race timer & race mode control

## How does it work?
### 1. Authentication
* When accessing an interface, the user must enter the correct access key.
* If the key is incorrect, there will be a 500ms delay before an error message appears.
* Once authenticated, the user can access the interface.
### 2. Front Desk
* **Receptionist** creates/modifies/deletes race sessions.
* **Receptionist** assignes/modifies/removes drivers from a race.
### 3. Race Control
* **Safety Officer** starts and stops race sessions.
* Resets session data before each race.
### 4. Lap Line Tracker
* Displays buttons for each driver to record lap times.
* Each driver has an individual lap timer that starts at 0 and resets after each lap.
* Sends lap data to the server when a button is pressed.
### 5. Leaderboard
* Displays race results sorted by fastest lap times.
* Updates in real-time as lap times are recorded.
### 6. Next Race
* Shows the information of the next upcoming race.
### 7. Race Countdown
* Displays time until current race ends.
### 8. Race flag
* Displays flag of the current race mode.


## How to use the tool yourself?
Follow these steps to set up and run the project:

Clone the repository

Open a shell/terminal in your computer.

Use following command:
```bash
git clone https://gitea.kood.tech/egertyakopoom/racetrack.git
```

Next, move to the project folder:
```bash
$ cd racetrack
```

Next, install dependencies:
```bash
$ npm install
```

Next, Construct .env file + Set Up Environment Variables
```bash
# .env
RECEPTIONIST_KEY=8ded6076
OBSERVER_KEY=662e0f6c
SAFETY_KEY=a2d393bc
PORT=3000
```

Now run the server with:
```bash
$ npm start
```
or
```bash
$ npm run dev
```

Once the server start, open your local browser and head to this address:
http://localhost:3000


### (Optional) Expose your local server to external networks using ngrok
If you want the application to be accessible from other devices (for example, to use it on a mobile device):

Sign Up and Download:
Go to [ngrok.com](https://ngrok.com/), create a free account, and download the appropriate version for your operating system, or;

Install ngrok via Apt with the following command in the terminal:
```bash
	curl -sSL https://ngrok-agent.s3.amazonaws.com/ngrok.asc \
	| sudo tee /etc/apt/trusted.gpg.d/ngrok.asc >/dev/null \
	&& echo "deb https://ngrok-agent.s3.amazonaws.com buster main" \
	| sudo tee /etc/apt/sources.list.d/ngrok.list \
	&& sudo apt update \
	&& sudo apt install ngrok
```

Authenticate ngrok:
Open a terminal, then run:
```bash
ngrok authtoken YOUR_AUTHTOKEN
```
Replace YOUR_AUTHTOKEN with the authtoken provided in your ngrok dashboard.

Start the tunnel:
Assuming your application runs on port 3000, execute:
```bash
ngrok http 3000
```
Use the public URL:
ngrok will display a public URL (e.g., https://abcd1234.ngrok.io). Use this URL on any device to access your locally running Racetrack application.


## User guide
### Accessing an interface
1. Open the application in your browser.
2. Navigate to the interface you want to use.
3. Enter the access key.
4. If the key is incorrect, you will see an error message and need to try again.
### Front Desk
* Create a New Race
	1. In the "Upcoming Races" section, Enter a race name (e.g., "Grand Prix") in the text box.
	2. Click "Add Race".
* Add Drivers to the Race
	1. Select a race from the list by clicking on it. → Race details appear on the right.
	2. Click "Add Driver".
	3. In the pop-up:
		* Driver Name: (e.g., "Bob")
		* Car ID: (e.g., "5" for "Car 5")
	4. Click "Add Driver".
* Edit Race Details
	* Change Race Name
		1. Select the race.
		2. Click "Change Race Name".
		3. Enter the new name (e.g., "Ultra Grand Prix").
		4. Click "Save".
	* Edit/Remove Drivers
		1. In the Race Details section:
			* Edit: Click the "Edit" button next to a driver → Update name/Car ID → "Save".
			* Remove: Click "Remove" → Confirm deletion.
* Delete a Race
	1. Select the race to delete.
	2. Click "Delete Race".
	3. Confirm by clicking "Yes, Delete".

### Race Controller
* Start a race with the button "Start race".
* During a race you can change the modes with the buttons "Safe", "Hazard", "Danger" and "Finish".
* When the race time is up, the race reaches the state "Finish".
* When "Finish" state is on: It will change the state to "Danger" and show the "Next race" window. The button "Start race" will then appear after.

### Lap Line Tracker
* The Lap Line Tracker interface is used for registering the lap times of the race.
* When there is no active race, there are no buttons.
* When the Race is active, the buttons appear, One button for every race driver.

### Race Flag
* The Race Flag screen is used to show the current race state.

### Race Countdown
* The Race Countdown screen is used to show  how much time is left in the current race.

### Next race
* The Next race screen is used to show who the drivers for the next race are, so they can prepare.

### Leader board
* The Leader board screen is used to keep the spectators informed of the current race.

## Creators
* Karlis Paulus
* Siim Siren
* Egert-Yako Poom



