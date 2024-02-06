import serial
import time


def sensor():

    ser = serial.Serial('COM6', 152000, timeout=2)

    try:
        while True:
            # Read a line from the serial port
            line = ser.readline().decode('utf-8').strip()

            # Display the received data
            if ',' in line:

                with open('./static/sensor_value.txt', 'w') as file:
                    file.write(line)
                    break

            # Optional: You can add additional processing or parsing here

    except KeyboardInterrupt:
        print("Serial communication interrupted by the user.")
    finally:
        # Close the serial port when the program is terminated
        ser.close()
