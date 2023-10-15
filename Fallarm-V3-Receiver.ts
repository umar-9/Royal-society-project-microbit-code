//--------------------------------------------------------------------------------------------------
/*
 * Team: Fallarm
 * Project: Royal Society
 * Product: Fall prevention and detection (FPAD)
 * Version number: 3
 * File name: Fallarm-V3-Receiver
 * Description: Receives data from the sensor via radio and evaluates it, deciding if there is a fall 
 *              or not, before passing to serial to be displayed on website using WebSerialAPI
 
List of shortened strings and their full counterparts:
    'int'        => 'Interpretation'
    'noc_hyp;'   => 'Nocturnal Hypoxia increases chance of fall;'
    'likely;'    => 'Fall likely;'
    'pulse_var;' => 'High pulse variation increases chance of fall;'
    'heatstroke;'=> 'Heatstroke likely'
    'med;'       => 'Medical action needed'
    'help;'      => 'Help requested
    'Norm'       => 'Normal'
    'L_pulse'    => 'Lower_pulse' (Lower bound)
    'U_pulse'    => 'Upper_pulse' (Upper bound)
    'U_sleep'    => 'Upper_sleep_pulse' (Upper bound of sleeping pulse)
Note that for the input, numbers 0 and 1 are used for booleans False and True
*/
//--------------------------------------------------------------------------------------------------
 
//CLASS SETUP---------------------------------------------------------------------------------------
class People {
    name: string
    output: O_arrays
    input: I_arrays
    time: number
    constructor(name: string, output: O_arrays, input: I_arrays, time: number) {
        this.name = name
        this.output = output
        this.input = input
        this.time = time
    }
    serial_out() {
        return [this.time, this.name, this.output, this.input]
    }
}
 
interface People_interface {
    [key: number]: any //either People or 'null'
}
 
let People_array: People_interface = {}
let ids: number[] = []
 
function adder (id: number) {
    ids.push(id)
 
    for (let i = 0; i < ids.length; i++) {
        People_array[ids[i]] = new People('', {}, {
            'dementia': 0,
            'U_pulse': 60,
            'L_pulse': 100,
            'spo2': 90,
            'on': 1
            }, 0
        )
    } 
}
 
adder(951260179)
 
//--------------------------------------------------------------------------------------------------
 
function size(array: O_arrays) {
    let size = 0
    let my_keys = Object.keys(array)
    size = my_keys.length
    return size
}
 
function nocturnal_hypoxia_id(spo2_radio: string[], sleep_count: number) {
    let noc_hypoxia = false
    if (sleep_count * 0.1 < parseInt(spo2_radio[2])) {
        noc_hypoxia = true
    }
    return noc_hypoxia
}
 
function evaluate(radio_array: O_arrays, id: number) {
    let output_array: O_arrays = { 'state': [''], 'accel': [radio_array['accel'][0]], 'pulse': [radio_array['pulse'][1]], 'spo2': [radio_array['spo2'][1]], 'temp': [radio_array['temp'][1]], 'int': ['']}
    // ^Copies the items relevant to the table headings^ to a separate array
 
    //identifies if person is asleep:
    if ((current_hour > 10 || current_hour < 5) && (parseInt(radio_array['pulse'][1]) < People_array[id]
.input['L_pulse'])) {
        sleep_counter ++
    }
    
    //identifies if there are abnormal vitals (including nocturnal hypoxia)
    let vitals_array = ['temp', 'pulse', 'spo2']
    let nocturnal_hypoxia = nocturnal_hypoxia_id(radio_array['spo2'], sleep_counter)
    for (let i = 0; i < 3; i++) {
        if (i == 2 && nocturnal_hypoxia) {
            output_array['int'][0] += 'noc_hyp;'
            output_array['state'][0] = 'likely;'
        }
        else if (i == 1 && radio_array['pulse'][2] == 'hi') {// if pulse variability is too high
            output_array['int'][0] += 'pulse_var;'
            output_array['state'][0] = 'likely;'
        }
        else if (i == 0 && radio_array['temp'][0] == 'hi') {
            output_array['int'][0] += 'heatstroke;'
            output_array['state'][0] = 'likely;'
        }
        else if (radio_array[vitals_array[i]][0] == 'hi' || radio_array[vitals_array[i]][0] == 'lo') {
            output_array['int'][0] += (vitals_array[i] + ':' + radio_array[vitals_array[i]][1]) + ';'//sets the state to the analysed pulse/spo2/temp array if they are abnormal
            if (output_array['state'][0] != 'likely;') {
                output_array['state'][0] = 'med;'
            }
        }
    }
    
    //identifies if a person is out of bed when should be sleeping
    if ((current_hour > 10 || current_hour < 5) && (radio_array['accel'][0] == 'continuous movement'))
 {
        output_array['state'][0] += 'Awake;'
    }
    
    //identifies button press
    if (radio_array['button'][0] == 'true') {
        output_array['state'][0] += 'Help;'
        output_array['int'][0] += 'help;'
    }
 
    //main identification stuff
    if (radio_array['accel'][0] == 'fall') {
        output_array['state'][0] = radio_array['accel'][0]
    }
    else {
        if (output_array['state'][0] == '') {
            output_array['state'][0] = 'Norm'
        }
    }
    
    return output_array
}
 
radio.onReceivedString(function (receivedString) {
    led.plot(2,4)
 
    let id = radio.receivedPacket(RadioPacketProperty.SerialNumber)
    id = 951260179
    People_array[id].time  = radio.receivedPacket(RadioPacketProperty.Time)
 
    let split_string: string[] = receivedString.split(',')
 
    radio_array[split_string[0]] = split_string[1].split(';')
        if (size(radio_array) == output_size) {
            People_array[id].output = evaluate(radio_array, id)
        }
 
    serial.writeLine(JSON.stringify(People_array[id].serial_out()))
 
    basic.clearScreen()
})
 
serial.onDataReceived(serial.delimiters(Delimiters.NewLine), function () {
    led.plot(2, 4)
    input_string = serial.readUntil(serial.delimiters(Delimiters.NewLine)).split(',')
    const action = 0, value = 1, id = 2
    interface p_i {
        [key: string]: number
    }
    const pulse_inputs: p_i = {'L_pulse': 0, 'U_pulse': 1, 'U_sleep': 2}
 
    if (input_string[action] == 'delete') {
        People_array[parseInt(input_string[id])] = 'null'
    }
 
    else if (input_string[action] == 'add') {
        adder(parseInt(input_string[id]))
    }
 
    else {
        People_array[parseInt(input_string[id])]['input'][input_string[action]] = input_string[value]
    }
    
    radio.sendString(input_string[id]+','+JSON.stringify(People_array[parseInt(input_string[id])]))
})
 
interface O_arrays { //output
    [key: string]: string[];
}
interface I_arrays { //input
    [key: string]: number
}
 
let input_string: string[] = []
let radio_array: O_arrays = {}
const output_size = 5 //ensures that everything has been sent before starting evaluation
radio.setGroup(101)
 
let current_hour = 0 //hour, e.g, 12 for 12:33
let sleep_counter = 0
