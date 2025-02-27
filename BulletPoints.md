# Backend Development
1. ### Race session managment 
	*	Add/modify/remove race sessions
	* 	Add/modify/remove Drivers
	*	Add/modify/remove cars
	*	Race session data stored in memory
2. ### Real-time race control with Socket.IO
	*	Start/modify/end race sessions
	*	Four race modes for safety officials:
		*	Safe
		*	Hazard
		*	Danger
		*	Finish
	*	After "Finish" mode, the mode cannot be changed again.
	*	Race timers (10 min prod, 1 min dev)
3. ### Lap-time recording
	*	Lap times recorded
	*	broadcast lap times in real time via Socket.IO
4.	###  Security (Server access key req for Safety official)
	*	Access key validation for employees
	*	500ms delay for incorrect keys
	*	server should not start id acess keys are missing


# Frontend
 ## Interfaces for Different Users
1.	### Recptionist interfac (Upcoming race configuration)
	*


2. ### Safety Official interface(Race start, control modes, finish race ect.)
	*


3. ### Lap-Line Observer interface(Lap time input)
	*



## Public displays
1. Real time Leaderboard for spectators
2. Next race = Show upcoming race details for drivers
3. Race countdown - Timer and flag status for drivers

### Access Control UI
1. access key for each employee for real time access

