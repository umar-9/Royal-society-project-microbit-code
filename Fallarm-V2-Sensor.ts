/*
    This algorithm is the one used in the most recent tests. 
    It does some basic interpretation and also includes the evaluation function within the sensor code, 
    something that we moved to the receiver in Version 3
*/


let reason = ""
let button = false
let pulseo2: number[] = []
let time = 0
let test_spo2 = 0
let test_pulse = 0
let fall_detected = false
let accel_high: boolean = false
let count = 0
class Sensor_setup {
    lower_norm: number; upper_norm: number; stationary: number; scope: number; upper_stationary: number; lower_stationary: number; movement_reset: number;
    constructor(lower_norm: number, upper_norm: number, stationary: number, scope: number, upper_stationary: number, lower_stationary: number, movement_reset: number) {
        this.lower_norm = lower_norm; this.upper_norm = upper_norm; this.stationary = stationary; this.scope = scope, this.upper_stationary = upper_stationary, this.lower_stationary = lower_stationary, this.movement_reset = movement_reset
    }
}
const accel_propty = new Sensor_setup(-600, 600, -1023, 100, -923, -1123, 3)
const pulse_propty = new Sensor_setup(60, 100, null, null, null, null, null)
const spo2_propty = new Sensor_setup(95, 100, null, null, null, null, null)
let interval = 300
let on = true
 
////////////////
test_pulse = 60
test_spo2 = 95
////////////////
let reset = false
interface Raw_accel_array {
    [key: number]: number[];
}
interface Raw_arrays {
    [key: number]: number;
}
interface Analysed_arrays {
    [key: number]: string
}
let raw_accel_array: Raw_accel_array = {}
let last_values = [input.acceleration(Dimension.X), input.acceleration(Dimension.Y), input.acceleration(Dimension.Z)]
let last_analysed = ["0", "0", "0"]
let analysed_accel_array: Analysed_arrays = {}
let raw_pulse_array: Raw_arrays = {}
let analysed_pulse_array: Analysed_arrays = {}
let raw_spo2_array: Raw_arrays = {}
let analysed_spo2_array: Analysed_arrays = {}
let accel_high_index: number
let stationary_index: number
let continuous_movement_index: number
 
let accel_timestamp = 0
let moving = false
let stationary = false
 
let dementia = false
 
 
function size(array: Analysed_arrays | Raw_arrays | Raw_accel_array) {
    let size = 0
    let my_keys = Object.keys(array)
    size = my_keys.length
    return size
}
 
function indexOf(array: any, item: any, time: number) {
    let index = -10000
    for (let i = 0; i < (time + interval); i += interval) {
        if (array[i] == item) {
            index = i
        }
    }
    return index
}
 
function in_array_counter(array: string[], item: any) {
    let moving_count = 0
    for (let j = -1; j < (array.length); j++) {
        if (array[j] == item) {
            moving_count++
        }
    }
    return moving_count
}
 
function str_to_bool(str: string) {
    if (str == "true") {
        return true
    } else {
        return false
    }
}
 
function resetter(extent: string) {
    if (extent == 'accel' || extent == 'all') {
        analysed_accel_array = {}
        analysed_accel_array[time] = 'Normal'
        accel_high = false
        raw_accel_array = {}
    }
    if (extent == 'pulse' || extent == 'all') {
        analysed_pulse_array = {}
        raw_pulse_array = {}
	    }
	    if (extent == 'spo2' || extent == 'all') {
	        analysed_spo2_array = {}
	        raw_spo2_array = {}
	    }
	    if (extent == 'button' || extent == 'all') {
	        button = false
	    }
	}
	 
	function get_radio() {
	    return
	    /*
	    - No physical clock, however, the input of time is required to find if a person is moving at night time - can be helped to get to the toilet or wherever they need to go
	    - Hypoxia during sleep can be detected with the clock as well, determining if there is a fall.
	    - Max and Min pulse and spo2 levels should be inputted, if not inputted then it is set to the default.*/
	 
	    //if (str == 'reset'){control.reset()} - allows staff to reset microbit
	    //if (str == 'off){on = false}
	}
	 
	 
	function f_to_radio(time: number, reason: string, analysed_accel_array: Analysed_arrays, raw_pulse_array: Raw_arrays, raw_spo2_array: Raw_arrays, button: boolean, fall_detected: boolean) {
	 
	    radio.setGroup(101)
	    radio.setTransmitSerialNumber(true)
	 
	    //radio.sendString("time" + "," + time)
	    radio.sendString("fall" + "," + fall_detected.toString())
	    radio.sendString("reason" + "," + reason)
	    if (moving == false && stationary == false) {
	        radio.sendString("accel" + "," + analysed_accel_array[time])
	    } else if (stationary == true) {
	        radio.sendString("accel" + "," + 'stationary')
	    } else if (moving == true) {
	        radio.sendString("accel" + "," + 'moving')
	    }
	 
	    radio.sendString("pulse" + "," + raw_pulse_array[time].toString())
	    radio.sendString("spo2" + "," + raw_spo2_array[time].toString())
	 
	}
	 
	 
	 
	function f_pulseo2(time: number) {
	    // get data from sensor, break into two, then store in arrays
	    let raw_pulse_value = test_pulse
	    let raw_spo2_value = test_spo2
	    return [raw_pulse_value, raw_spo2_value]
	}
	 
	 
	 
	function f_analyse_accel(analysed_array: Analysed_arrays, array: Raw_accel_array, time: number) { //exclusively for accelerometer analysis
	    //array passed follows this format: {time: [X,Y,Z], time: [X,Y,Z] }
	 
	    let x = 0, y = 1, z = 2
	    if (count == 0) {
	        basic.clearScreen()
	    }
	 
	    moving = false
	    stationary = false
	 
	    //stationary-----------------------------------------------------------------------------------------
	    if (
	        ((accel_propty.lower_stationary < array[time][z] && array[time][z] < accel_propty.upper_stationary)
	            || (Math.abs(array[time][z] - last_values[z]) < accel_propty.scope))
	        && (Math.abs(array[time][x] - last_values[x]) < accel_propty.scope)
	        && (Math.abs(array[time][y] - last_values[y]) < accel_propty.scope)
	    ) {
	        //led.plot(count % 5, 2)
	 
	        if (accel_high) {
	            analysed_array[time] = 'stationary'
	            stationary_index = indexOf(analysed_array, 'stationary', time)
	            /*if (in_array_counter(last_analysed, 'stationary') > accel_propty.movement_reset) {
	                reset = true
	            }*/
	        }
	        stationary = true
	    }
	 
	    //accel_high-----------------------------------------------------------------------------------------
	    else if (
	        (accel_propty.lower_norm < array[time][z] && array[time][z] < accel_propty.upper_norm)
	        && array[time][z] - last_values[z] > accel_propty.scope
	    ) {
	        //led.plot(count % 5, 0), //led.plot(count % 5, 4)
	        analysed_array[time] = 'accel_high'
	        accel_high = true
	        accel_timestamp = time
	        accel_high_index = indexOf(analysed_array, 'accel_high', time)
	    }
	 
	    //ordinary movement---------------------------------------------------------------------------------
	    else {
	        if (accel_high) {
	            analysed_array[time] = 'moving'
	        }
	        moving = true
	        //led.plot(count % 5, 1), //led.plot(count % 5, 3)
	    }
	 
	    //continuous_movement-------------------------------------------------------------------------------
	    if (in_array_counter(last_analysed, 'moving') >= accel_propty.movement_reset) {
	        if (accel_high) {
	            analysed_array[time] = 'continuous_movement'
	        }
	        
	        if (accel_high){
	            if (time - accel_timestamp > 4000){
	                accel_high = false
	                accel_high_index = -10000
	            }
	        }
	        //led.plot(count % 5, 1), //led.plot(count % 5, 2), //led.plot(count % 5, 3)
	    }
	 
	    //exercise--------------------------------------------------------------------------------------
	    if (in_array_counter(last_analysed, 'continuous_movement') >= 300000 / interval) {
	        analysed_array = {}
	        analysed_array[time] = 'exercise'
	        accel_high = false
	        //led.plot(count % 5, 1), //led.plot(count % 5, 2), //led.plot(count % 5, 3)
	 
	        //will ignore any anomalous pulse readings or spo2 readings
	    }
	 
	 
	 
	    //FALLS-------------------------------------------------------------------------------------
	    if (analysed_array[time] == 'stationary' && accel_high == true && accel_high_index != -10000) {
	            if (accel_high_index < stationary_index) {
	                analysed_array[time] = 'fall'
	                basic.clearScreen()
	 
	            } 
	            
	            if (accel_high_index == -10000) { reset = true } 
	 
	    }
	 
	    last_values = [array[time][x], array[time][y], array[time][z]]
	    count += 1
	    last_analysed[count % (accel_propty.movement_reset + 1)] = analysed_array[time]  //store the last 5 analysed_accel_array values
	    if (count % 5 == 0 && fall_detected == false) { basic.clearScreen() } //when to clear screen for next LED sequence to occur
	 
	    if (reset || (accel_high == false)) {
	        resetter('accel')
	    }
	 
	    return analysed_array
	}
	 
	 
	function f_analyse(analysed_array: Analysed_arrays, array: Raw_arrays, time: number, upper_norm: number, lower_norm: number) {
	    analysed_array[time] = 'normal'
	    if (array[time] > upper_norm) {
	        analysed_array[time] = 'high'
	        basic.showLeds(`
	        . . # . .
	        . # # # .
	        # . # . #
	        . . # . .
	        . . # . .
	        `)
	    }
	 
	    if (array[time] < lower_norm) {
	        analysed_array[time] = 'low'
	        basic.showLeds(`
	        . . # . .
	        . . # . .
	        # . # . #
	        . # # # .
	        . . # . .
	        `)
	    }
	    return analysed_array
	}
	function f_evaluate(analysed_accel_array: Analysed_arrays, analysed_pulse_array: Analysed_arrays, analysed_spo2_array: Analysed_arrays, button: boolean, time: number) {
	    let fall_detected_formatted = false
	    reason = ''
	    if ((analysed_accel_array[time] == 'fall' || analysed_pulse_array[time] == 'high' || analysed_spo2_array[time] == 'high' || button) && analysed_accel_array[time] != 'exercise') {
	        fall_detected_formatted = true
	        basic.showLeds(` 
	                # # # # #
	                # # # # #
	                # # # # #
	                # # # # #
	                # # # # #
	                `)
	 
	        if (analysed_accel_array[time] == "fall") {
	            reason += "Movement;"
	        }
	        if (analysed_pulse_array[time] == "high") {
	            reason += "Pulse;"
	        }
	        if (analysed_spo2_array[time] == "high") {
	            reason += "Oxygen;"
	        }
	        if (button) {
	            reason += "User;"
	        }
	    }
	    if (analysed_accel_array[time] == 'exercise' && analysed_accel_array[time] == 'fall') {
	        //Fall detected cannot be triggered by pulse and spo2 
	        if (analysed_accel_array[time] == "fall") {
	            reason += "Movement;"
	        }
	        if (button) {
	            reason += "User;"
	        }
	    }
	    let my_string = '' + fall_detected_formatted
	    let my_list: any = [my_string, reason]
	    return my_list
	}
	 
	 
	// MAIN flow
	loops.everyInterval(interval, function () {
	    if (on) {
	        pins.digitalWritePin(DigitalPin.P0, 0)
	        //makes buzzer pulse if uncommented. If commented, astable circuit is required
	        basic.pause(interval)
	        time = Math.round(input.runningTime() / interval) * interval // rounds to nearest interval
	        // {time: [X,Y,Z], time: [X,Y,Z] }
	 
	        get_radio()
	 
	        raw_accel_array[time] = [input.acceleration(Dimension.X), input.acceleration(Dimension.Y), input.acceleration(Dimension.Z)]
	        analysed_accel_array = f_analyse_accel(analysed_accel_array, raw_accel_array, time)
	 
	        pulseo2 = f_pulseo2(time)
	        raw_pulse_array[time] = pulseo2[0]
	        raw_spo2_array[time] = pulseo2[1]
	 
	        analysed_pulse_array = f_analyse(analysed_pulse_array, raw_pulse_array, time, pulse_propty.upper_norm, pulse_propty.lower_norm)
	        analysed_spo2_array = f_analyse(analysed_spo2_array, raw_spo2_array, time, spo2_propty.upper_norm, spo2_propty.lower_norm)
	 
	        let fall_list: string[] = f_evaluate(analysed_accel_array, analysed_pulse_array, analysed_spo2_array, button, time)
	        let fall_detected_string: string = fall_list[0]
	        fall_detected = str_to_bool(fall_detected_string)
	        reason = fall_list[1]
	 
	        f_to_radio(time, reason, analysed_accel_array, raw_pulse_array, raw_spo2_array, button, fall_detected)
	 
	        if (fall_detected) {
	            pins.digitalWritePin(DigitalPin.P0, 1)
	        } else {
	            pins.digitalWritePin(DigitalPin.P0, 0)
	        }
	 
	        raw_pulse_array = {}
	        analysed_pulse_array = {}
	        raw_spo2_array = {}
	        analysed_spo2_array = {}
	        analysed_accel_array = {}
	        raw_accel_array = {}
	 
	        
	    }
	 
	})
	 
	 
	input.onButtonPressed(Button.A, function () {
	    if (!dementia) { button = true }
	    //led.plot(0, 0), //led.plot(4, 4)
	})
	 
	input.onButtonPressed(Button.B, function () {
	    //led.plot(4, 0), //led.plot(0, 4)
	    if (!dementia) { resetter('all') }
	})
	 
	radio.onReceivedString(function(receivedString: string) {
	    let edit_string = receivedString.split(',')
	    if (edit_string[0] == 'spo2_typ') {
	        spo2_propty.upper_norm = parseInt(edit_string[1]) + 20
	        spo2_propty.lower_norm = parseInt(edit_string[1]) - 20
	    } else if (edit_string[0] == 'pulse_typ') {
	        pulse_propty.upper_norm = parseInt(edit_string[1]) + 20
	        pulse_propty.lower_norm = parseInt(edit_string[1]) - 20
	    } else if (edit_string[0] == 'dementia') {
	        if (edit_string[1] == 'true' || edit_string[1] == 'True') { dementia = true }
	        if (edit_string[1] == 'false' || edit_string[1] == 'False') { dementia = false }
	    }
	})
