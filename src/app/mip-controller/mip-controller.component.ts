import { Component, OnInit } from '@angular/core';
import bluetooth = require('nativescript-bluetooth');
import { ActivatedRoute } from '@angular/router';

import { startAccelerometerUpdates, stopAccelerometerUpdates, AccelerometerData } from 'nativescript-accelerometer';

import { Observable, Subscription } from 'rxjs';
import { sampleTime } from 'rxjs/operators'

@Component({
  selector: 'mip-controller',
  moduleId: module.id,
  templateUrl: './mip-controller.component.html',
  styleUrls: ['./mip-controller.component.css']
})

export class MipControllerComponent implements OnInit {
  serviceUUID: string = 'ffe5';
  characteristicUUID: string = 'ffe9';
  deviceUUID: string = '';

  loopHandle: number = null;
  accelerometerSubscription: Subscription = Subscription.EMPTY;

  constructor(private route: ActivatedRoute) { }

  ngOnInit() {
    this.deviceUUID = this.route.snapshot.params['UUID'];

    this.accelerometerSubscription.closed
  }

  moveForward() {
    bluetooth.writeWithoutResponse({
      serviceUUID: this.serviceUUID,
      characteristicUUID: this.characteristicUUID,
      peripheralUUID: this.deviceUUID,
      value: new Uint8Array([0x71,0x20,0x40])
      // value: new Uint8Array([0x71,32,64])
      // value: '0x71,0x20,0x40'
    })
  }

  moveBack() {
    bluetooth.writeWithoutResponse({
      serviceUUID: this.serviceUUID,
      characteristicUUID: this.characteristicUUID,
      peripheralUUID: this.deviceUUID,
      value: new Uint8Array([0x72,0x20,0x40])
    })
  }

  turnLeft() {
    bluetooth.writeWithoutResponse({
      serviceUUID: this.serviceUUID,
      characteristicUUID: this.characteristicUUID,
      peripheralUUID: this.deviceUUID,
      value: new Uint8Array([0x73,0x1E,0x20])
    })
  }

  turnRight() {
    bluetooth.writeWithoutResponse({
      serviceUUID: this.serviceUUID,
      characteristicUUID: this.characteristicUUID,
      peripheralUUID: this.deviceUUID,
      value: new Uint8Array([0x73,0x1E,0x20])
    })
  }

  startAccelerometerInterval() {
    let turn: number = 0;
    let speed: number = 0;

    startAccelerometerUpdates( 
      (data: AccelerometerData) => {
        turn = data.x;  //Tilt left [-1 to 0] Tilt right [0 to 1]
        speed = data.y; //Tilt back [-1 to 0] Tilt forward [0 to 1]
      }
    );

    this.loopHandle = setInterval(() => {
      this.continuousDrive(speed, turn);
    }, 50);
  }

  stopAccelerometerInterval() {
    if(this.loopHandle) {
      stopAccelerometerUpdates();

      clearInterval(this.loopHandle);

      this.loopHandle = null;
    }
  }

  startAccelerometerRxjs() {
    const accelerometer$ = new Observable<AccelerometerData>(observer => {
      startAccelerometerUpdates(
        (data: AccelerometerData) => {
          observer.next(data);
        }
      )

      return () => stopAccelerometerUpdates();
    });

    this.accelerometerSubscription = accelerometer$
    .pipe(
      sampleTime(50)
    )
    .subscribe(data => {
      this.continuousDrive(data.y, data.x)
    });
  }

  stopAccelerometerRxjs() {
    this.accelerometerSubscription.unsubscribe();
  }

  continuousDrive(speed: number, turn: number) {
    const mipSpeed = (speed > 0) ? this.convertTo0x20(speed, 0) : this.convertTo0x20(speed, 0x20);
    const mipTurn = (turn > 0) ? this.convertTo0x20(turn, 0x40) : this.convertTo0x20(turn, 0x60);

    bluetooth.writeWithoutResponse({
      serviceUUID: this.serviceUUID,
      characteristicUUID: this.characteristicUUID,
      peripheralUUID: this.deviceUUID,
      value: new Uint8Array([0x78, mipSpeed, mipTurn])
    });
  }

  convertTo0x20(val: number, offset: number) {
    if(val < 0) {
      val = -val;
    }

    return Math.floor(val * 0x20) + offset;
  }
}
