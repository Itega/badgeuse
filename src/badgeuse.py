#!/usr/bin/python
# Example using a character LCD connected to a Raspberry Pi

import RPi.GPIO as GPIO
import MFRC522
import signal
from subprocess import call
import mysql.connector
import datetime
import time

continue_reading = True

cnx = mysql.connector.connect(user='root', password='root',
                              host='localhost',
                              database='badgeuse')


# Capture SIGINT for cleanup when the script is aborted
def end_read(signal, frame):
    global continue_reading
    print "Ctrl+C captured, ending read."
    continue_reading = False
    GPIO.cleanup()
    cnx.close()


# Hook the SIGINT
signal.signal(signal.SIGINT, end_read)

# Create an object of the class MFRC522
MIFAREReader = MFRC522.MFRC522()

GPIO.setup(33, GPIO.OUT)
GPIO.setup(31, GPIO.OUT)

def print_screen(string):
    call(['/home/pi/MFRC522-python/lcd_write', string])


def lookup(uid):
    try:
        cursor = cnx.cursor()
        name = ''
        surname = ''
        answer = cursor.callproc('uid_lookup', [uid, name, surname])
    finally:
        if 'cursor' in locals():
            cursor.close()
    if answer[1] is not None and answer[2] is not None:
        return answer[1] + "\n" + answer[2]
    return False


def insert(uid, salle):
    try:
        cursor = cnx.cursor()
        cursor.callproc('insert_presence', [uid, salle, isMorning()])
    finally:
        cnx.commit()
        if 'cursor' in locals():
            cursor.close()


def isMorning():
    now = datetime.datetime.now()
    now_time = now.time()
    if datetime.time(6, 00) <= now_time <= datetime.time(12, 30):
        return 1
    return 0


print_screen('Scannez votre\nbadge')
while continue_reading:
    # try:

    # Scan for cards
    (status, TagType) = MIFAREReader.MFRC522_Request(MIFAREReader.PICC_REQIDL)

    # Get the UID of the card
    (status, uid) = MIFAREReader.MFRC522_Anticoll()

    # If we have the UID, continue
    if status == MIFAREReader.MI_OK:
        complete_uid = ''
        # Print UID
        for u in uid:
            complete_uid += str(u)
        print complete_uid
        result = lookup(complete_uid)
        if result:
            insert(complete_uid, 'E121')
            print_screen(result)
            GPIO.output(31, GPIO.HIGH)
        else:
            print_screen("Veuillez\nReessayer")
            GPIO.output(33, GPIO.HIGH)
        time.sleep(1)
        GPIO.output(33, GPIO.LOW)
        GPIO.output(31, GPIO.LOW)
        print_screen('Scannez votre\nbadge')
# except Exception as e:
#     print e
