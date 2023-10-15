/*
    This algorithm is the one used for the most recent tests. 
    It functions on the basis of radio communication between the two micro:bits and sends, 
    via. the serial port, a table to be outputted to TeraTerm (serial software). 
    This code was previously over the limit but has since been optimised to save space.
*/
radio.onReceivedString(function (receivedString) {
 
    led.plot(2, 0)
    split_string = receivedString.split(",")
    id2 = radio.receivedPacket(RadioPacketProperty.SerialNumber)
    time = radio.receivedPacket(RadioPacketProperty.Time)
    if (split_string[0] == "fall") {
        fall = split_string[1]
    }
    if (split_string[0] == "reason") {
        let reason = split_string[1]
        let reasons_list = reason.split(';')
        reasons = ''
        for (let i of reasons_list) {
            if (i == 'Us') {
                reasons = reasons + ', ' + 'User'
            } else {
                reasons = reasons + ', ' + i
            }
            
        }
    }
    
    if (split_string[0] == "accel") {
        accel = split_string[1]
    }
    if (split_string[0] == "pulse") {
        pulse = split_string[1]
    }
    if (split_string[0] == "spo2") {
        spo2 = split_string[1]
    }
    if (fall == "true" && reasons != "None" && accel != "Not sent" && pulse != "Not sent" && spo2 != "Not sent") {
        serial.writeLine("-Name-|-Typ-SpO2-|-Typ-Pulse-|-Dementia--|-SpO2-|-Pulse-|-Fall-|--------Accel-|-Reason ")
        serial.writeLine("Person|----" + spo2_typ + "----|----" + pulse_typ + "-----|---" + dementia + "----|--" + spo2 + "--|---" + pulse + "--|-" + fall + "-|-" + accel + "-|-" + reasons + '-|-')
        //serial.writeLine("Person|----96----|----67-----|---True---\|--97--|---75--|-")
        //serial.writeLine("Person|----96----|----67-----|---False---|--97--|---75--|-")
        
        serial.writeString('\n')
        serial.writeLine('----------------------------------------------------------------------------------')
        fall = "None"
        reasons = "None"
        accel = "Not sent"
        pulse = "Not sent"
        spo2 = "Not sent"
 
        basic.showLeds(`
        # . . . #
        . # . # .
        . . # . .
        . # . # .
        # . . . #
        `)
    }
    if (fall == "false" && accel != "Not sent" && pulse != "Not sent" && spo2 != "Not sent") {
        serial.writeLine("-Name-|-Typ-SpO2-|-Typ-Pulse-|-Dementia--|-SpO2-|-Pulse-|-Fall-|--------Accel-")
        serial.writeLine("Person|----" + spo2_typ + "----|----" + pulse_typ + "-----|---" + dementia + "----|--" + spo2 + "--|---" + pulse + "--|-" + fall + "-|-" + accel + "-|-")
        serial.writeLine('----------------------------------------------------------------------------------')
        fall = "None"
        reasons = "None"
        accel = "Not sent"
        pulse = "Not sent"
        spo2 = "Not sent"
    }
 
    basic.clearScreen()
})
 
serial.onDataReceived(serial.delimiters(Delimiters.NewLine), function () {
    led.plot(2, 4)
    input_string = serial.readUntil(serial.delimiters(Delimiters.NewLine)).split(',')
    if (input_string[0] == 'spo2_typ') {
        spo2_typ = parseInt(input_string[1])
        radio.sendString('spo2_typ, ' + input_string[1])
    } else if (input_string[0] == 'pulse_typ') {
        pulse_typ = parseInt(input_string[1])
        radio.sendString('pulse_typ, ' + input_string[1])
    } else if (input_string[0] == 'dementia') {
        dementia = input_string[1]
        radio.sendString('dementia, ' + input_string[1])
    }
 
})
 
let input_string: string[]
let reasons_list: string[] = []
let reason = ""
let time = 0
let id2 = 0
let split_string: string[] = []
let spo2_typ = 0
let pulse_typ = 0
let fall = "Not sent"
let reasons = "Not sent"
let accel = "Not sent"
let pulse = "Not sent"
let spo2 = "Not sent"
let dementia = 'false'
 
radio.setGroup(101)
pulse_typ = 80
spo2_typ = 96
	 
let reference_time: number
    