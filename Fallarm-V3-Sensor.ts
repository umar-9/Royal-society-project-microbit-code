//--------------------------------------------------------------------------------------------------
/*
 * Team: Fallarm
 * Project: Royal Society
 * Product: Fall prevention and detection (FPAD)
 * Version number: 3.1
 * File name: Fallarm-V3-Sensor
 * Description: Monitors accelerometer, pulse oximeter and temperature to inform of a potential fall
 
List of shortened strings/var names and their full counterparts:
    a_hi    => accel_high
    move    => moving
    c_move  => continuous_moving
    rest    => stationary
*/
//--------------------------------------------------------------------------------------------------
 
// GENERAL SETUP
let button = false
let time = 0
let count = 0
let interval = 300
let on = true
let reset = false
let dementia = false
class Sensor_setup {
    lower_norm: number; upper_norm: number; rest: number; scope: number; movement_reset: number;
    constructor(lower_norm: number, upper_norm: number, rest: number, scope: number, movement_reset:
number) {
        this.lower_norm = lower_norm; this.upper_norm = upper_norm; this.rest = rest; this.scope = scope, this.movement_reset = movement_reset
    }
}
//}


//INDEX SIGNATURES {
interface Raw_accel_array {
    [key: number]: number[];
}
interface Raw_arrays {
    [key: number]: number;
}
interface Analysed_arrays {
    [key: number]: string
}
//}

// PULSE OXIMETER SETUP {
let raw_pulse: number
let analysed_pulse: string
let raw_spo2: number
let analysed_spo2: string
//movement_reset for pulse_propty is the number of pulse values 
//that must be above the current pulse value for it to be considered in pulse variability calculations 
//scope here is the threshold for pulse variability
//rest here is the upper bound of sleeping (rest) pulse
let pulse_propty = new Sensor_setup(60, 100, 60, 20, 2)
let spo2_min = 90
let spo2_max = 100

let max_pulse = 1000
let min_pulse = 0
let range_pulse = 0
let pulse_variability: string
let spo2_hypoxic_len = 0 //the number of times the person is hypoxic (to be used to determine if >10% of sleep is hypoxic)

let last_pulse: number[] = []
///////////////////////
let test_pulse = 60 //
let test_spo2 = 95 //
////////////////////
//}

// TEMPERATURE SETUP {
//const temp_propty = new Sensor_setup(20, 40, null, null, null)
const temp_max = 40
const temp_min = 20
let raw_temp: number
let analysed_temp: string
//}

// ACCELEROMETER SETUP {
let a_hi: boolean = false
let accel_timestamp = 0
let move = false
let rest = false
let accel_high_index: number
let rest_index: number
let c_move_index: number
const accel_propty = new Sensor_setup(-600, 600, -1023, 100, 3)

//optimisation variables {
    const NORM = 0
    const REST = 10
    const MOVING = 5
    const A_HIGH = 100
    const FALL = -100
    const C_MOVING = 55
    const EXERCISE = 555
//}

let raw_accel_array: Raw_accel_array = {}
let last_values = [input.acceleration(Dimension.X), input.acceleration(Dimension.Y), input.acceleration(Dimension.Z)]
let last_analysed: number[] = []
let analysed_accel_array: Raw_arrays = {}
//}

//--------------------------------------------------------------------------------------------------

// FUNCTIONS

function indexOf(array: any, item: any, time: number) {
let index = -100
for (let i = 0; i < (time + interval); i += interval) {
    if (array[i] == item) {
        index = i
    }
}
return index
}

function in_array_counter(array: number[], value: number, scope: number) {
let moving_count = 0
for (let j = -1; j < (array.length); j++) {
    if (array[j] >= value - scope && array[j] <= value + scope) {
        moving_count++
    }
}
return moving_count
}

function resetter(all: boolean) {
//all 0 means only reset accel, all 1 means all
analysed_accel_array = {}
analysed_accel_array[time] = NORM
a_hi = false
raw_accel_array = {}
basic.clearScreen()

if (all == true) {
    button = false
}
}

function f_to_radio(time: number, analysed_accel_array: Raw_arrays, str_pulse: string, str_spo2: string, str_temp: string, button_press: boolean) {
radio.setGroup(101)
radio.setTransmitSerialNumber(true)

let acceleration: string
if (move == false && rest == false) {
    acceleration = 'other'
} else if (rest == true) {
    acceleration = 'rest'
} else if (move == true) {
    acceleration = 'move'
}
if (a_hi == true) {
    acceleration = 'fall'
}

radio.sendString("accel" + "," + acceleration + ';')
radio.sendString("pulse" + "," + str_pulse)
radio.sendString("spo2" + "," + str_spo2)
radio.sendString("temp" + "," + str_temp)
radio.sendString("button" + ',' + button_press.toString() + ';')
}

function f_get_pulse() {
// get data from sensor
let raw_pulse_value = test_pulse
return raw_pulse_value
}

function f_get_spo2() {
// get data from sensor
let raw_spo2_value = test_spo2
return raw_spo2_value
}

function f_pulse_variability(time: number, raw_pulse: number) {
//Calculates the variation of heart rate, if this gets to pulse_propty.scope, then a fall is likely
last_pulse[count % (pulse_propty.movement_reset + 1)] = raw_pulse

let pulse_variability: string

if (in_array_counter(last_pulse, raw_pulse,5) >= pulse_propty.movement_reset) {
    //check for consistency - must be of that particular value to be counted for the following calculations
    if (raw_pulse > min_pulse) { min_pulse = raw_pulse }
    if (raw_pulse < max_pulse) { max_pulse = raw_pulse }
    range_pulse = max_pulse - min_pulse
}

if (range_pulse > pulse_propty.scope) {
    pulse_variability = 'hi'
} else {
    pulse_variability = 'lo'
}
return pulse_variability
}

function length_hypoxia(spo2_analysed: string, length: number) {
if (spo2_analysed == 'lo') {
    length++
}
return length
}

function f_analyse_accel(analysed_array: Raw_arrays, array: Raw_accel_array, time: number) { //exclusively for accelerometer analysis
//array passed follows this format: {time: [X,Y,Z], time: [X,Y,Z] }
const x = 0, y = 1, z = 2

if (count == 0) {
    basic.clearScreen()
}

move = false
rest = false

//rest-----------------------------------------------------------------------------------------
if (
    (((accel_propty.rest - accel_propty.scope) < array[time][z] && array[time][z] < (accel_propty.rest + accel_propty.scope))
        || (Math.abs(array[time][z] - last_values[z]) < accel_propty.scope))
    && (Math.abs(array[time][x] - last_values[x]) < accel_propty.scope)
    && (Math.abs(array[time][y] - last_values[y]) < accel_propty.scope)
    ) {
    //led.plot(count % 5, 2)

    if (a_hi == true) {
        analysed_array[time] = REST
        rest_index = indexOf(analysed_array, REST, time)
    }
    rest = true
}

//a_hi-----------------------------------------------------------------------------------------
else if (
    (accel_propty.lower_norm < array[time][z] && array[time][z] < accel_propty.upper_norm)
    && array[time][z] - last_values[z] > accel_propty.scope
) {
    //led.plot(count % 5, 0), //led.plot(count % 5, 4)
    analysed_array[time] = MOVING
    a_hi = true
    accel_timestamp = time
    accel_high_index = indexOf(analysed_array, MOVING, time)
}

//ordinary movement-------------------------------------------------------------------------------
else {
    if (a_hi == true) {
        analysed_array[time] = MOVING
    }
    move = true
    //led.plot(count % 5, 1), //led.plot(count % 5, 3)
}

//continuous_move-------------------------------------------------------------------------------
if (in_array_counter(last_analysed, MOVING,0) >= accel_propty.movement_reset) {
    if (a_hi == true) {
        analysed_array[time] = C_MOVING
    }

    if (a_hi == true) {
        if (time - accel_timestamp > accel_propty.movement_reset * 1000) {
            a_hi = false
            accel_high_index = -100
        }
    }
    //led.plot(count % 5, 1), //led.plot(count % 5, 2), //led.plot(count % 5, 3)
}

//exercise--------------------------------------------------------------------------------------
if (in_array_counter(last_analysed, C_MOVING,0) >= 300000 / interval) {
    analysed_array = {}
    analysed_array[time] = EXERCISE
    a_hi = false
    //led.plot(count % 5, 1), //led.plot(count % 5, 2), //led.plot(count % 5, 3)

    //will ignore any anomalous pulse readings or spo2 readings once exercising - would be triggered by even walking up stairs
}

//FALLS-------------------------------------------------------------------------------------
if (analysed_array[time] == REST && a_hi == true && accel_high_index != -100) {
    if (accel_high_index < rest_index) {
        analysed_array[time] = FALL
        basic.clearScreen()
    }

    if (accel_high_index == -100) { reset = true }

}

last_values = [array[time][x], array[time][y], array[time][z]]
last_analysed[count % (accel_propty.movement_reset + 1)] = analysed_array[time]  //store the last 5 analysed_accel_array values
if (count % 5 == 0 && analysed_array[time] != FALL) { basic.clearScreen() } //when to clear screen for next LED sequence to occur

if (reset == true || a_hi == false) {
    resetter(false)
}

return analysed_array
}

function f_analyse(analysed_value: string, value: number, time: number, upper_norm: number, lower_norm: number) {
analysed_value = 'norm'
if (value > upper_norm) {
    analysed_value = 'hi'
    basic.showArrow(0)
}

if (value < lower_norm) {
    analysed_value = 'lo'
    basic.showArrow(4)
}
return analysed_value
}

//--------------------------------------------------------------------------------------------------
// MAIN flow
loops.everyInterval(interval, function () {
if (on == true) {
    pins.digitalWritePin(DigitalPin.P0, 0)
    //makes buzzer pulse if uncommented. If commented, astable circuit is required
    basic.pause(interval)
    time = Math.round(input.runningTime() / interval) * interval // rounds to nearest interval
    // {time: [X,Y,Z], time: [X,Y,Z] }

    raw_accel_array[time] = [input.acceleration(Dimension.X), input.acceleration(Dimension.Y), input.acceleration(Dimension.Z)]
    analysed_accel_array = f_analyse_accel(analysed_accel_array, raw_accel_array, time)
    if (analysed_accel_array[time] == FALL || button == true) {
        basic.showLeds(`
        #####
        #####
        #####
        #####
        #####
        `)
    }

    raw_temp = input.temperature()
    analysed_temp = f_analyse(analysed_temp, raw_temp, time, temp_max, temp_min)

    raw_pulse = f_get_pulse()
    if (rest == true) { //only measures when at rest - stationary arm
        raw_spo2 = f_get_spo2()
    }

    pulse_variability = f_pulse_variability(time, raw_pulse)
    analysed_pulse = f_analyse(analysed_pulse, raw_pulse, time, pulse_propty.upper_norm, pulse_propty.lower_norm)
    analysed_spo2 = f_analyse(analysed_spo2, raw_spo2, time, spo2_max, spo2_min)
    spo2_hypoxic_len = length_hypoxia(analysed_spo2, spo2_hypoxic_len)

    f_to_radio(time, analysed_accel_array, analysed_pulse + ';' + raw_pulse.toString() + ';' + pulse_variability, analysed_spo2 + ';' + raw_spo2.toString() + ';' + spo2_hypoxic_len.toString(), analysed_temp + ';' + raw_temp.toString(), button,)

    if (analysed_accel_array[time] == FALL) {
        pins.digitalWritePin(DigitalPin.P0, 1)
    } else {
        pins.digitalWritePin(DigitalPin.P0, 0)
    }

    analysed_accel_array = {}
    raw_accel_array = {}

    count++
}
})
//--------------------------------------------------------------------------------------------------

input.onButtonPressed(Button.A, function () {
if (dementia == false) { button = true }
//led.plot(0, 0), //led.plot(4, 4)
})

input.onButtonPressed(Button.B, function () {
//led.plot(4, 0), //led.plot(0, 4)
if (dementia == false) { resetter(true) }
})

interface IO_arrays { //input and output
[key: string]: string[];
}

radio.onReceivedString(function (receivedString: string) {
let edit_string = receivedString.split(',')
if (parseInt(edit_string[0]) == control.deviceSerialNumber()) {
    let edit_array: IO_arrays = JSON.parse(edit_string[1])
    dementia = JSON.parse(edit_array['dementia'][0])
    spo2_min = parseInt(edit_array['spo2'][0])
    pulse_propty.lower_norm = parseInt(edit_array['pulse'][0])
    pulse_propty.upper_norm = parseInt(edit_array['pulse'][1])
    pulse_propty.rest = parseInt(edit_array['pulse'][2])
    on = JSON.parse(edit_array['on'][0])
}
})
