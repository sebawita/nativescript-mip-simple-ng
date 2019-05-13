import { Component, OnInit, NgZone } from '@angular/core';
import bluetooth = require('nativescript-bluetooth');
import { Peripheral } from 'nativescript-bluetooth';
import { Router } from '@angular/router';
import { Observable, Subscription } from 'rxjs';
import { distinctUntilChanged } from 'rxjs/operators';

@Component({
  selector: 'mip-scan',
  moduleId: module.id,
  templateUrl: './mip-scan.component.html',
  styleUrls: ['./mip-scan.component.css']
})

export class MipScanComponent implements OnInit {
  isEnabledSubscription: Subscription;
  isBluetoothEnabled = false;

  devices: any[] = [{
    UUID: '1111',
    name: 'test mip 1'
  },{
    UUID: '2222',
    name: 'test mip 2'
  }];

  constructor(private router: Router) { 
    bluetooth.setCharacteristicLogging(false);
  }

  ngOnInit() {
    bluetooth.requestCoarseLocationPermission();

    this.isEnabledSubscription = this.listenToBluetoothEnabled()
      .subscribe(enabled => this.isBluetoothEnabled = enabled);
  }

  public listenToBluetoothEnabled(): Observable<boolean> {
    return new Observable<boolean>(observer => {
      bluetooth.isBluetoothEnabled()
        .then(enabled => observer.next(enabled))

      let intervalHandle = setInterval(
        () => {
          bluetooth.isBluetoothEnabled()
            .then(enabled => observer.next(enabled))
        }
        , 1000);

      // stop checking every second on unsubscribe
      return () => clearInterval(intervalHandle);
    })
    .pipe(
      distinctUntilChanged()
    );
  }

  addDevice(name: string, UUID: string) {
    this.devices.push({ name, UUID});
  }

  scan() {
    this.devices = [];

    bluetooth.startScanning({
      skipPermissionCheck: true,
      seconds: 3,
      // serviceUUIDs: ['ffe5'],
      // serviceUUIDs: ['0000ffe5-0000-1000-8000-00805f9b34fb'],
      onDiscovered: (peripheral: Peripheral) => {
        if(peripheral.name) {
          console.log(`UUID: ${peripheral.UUID} name: ${peripheral.name}`)
          this.devices.push(peripheral);
        }
      }
    })
  }

  connect(UUID: string) {
    bluetooth.connect({
      UUID: UUID,
      onConnected: (peripheral: Peripheral) => {
        // alert('Connected');
        this.router.navigate(['mipcontroller', UUID]);
      },
      onDisconnected: (peripheral: Peripheral) => {
        this.router.navigate(['mipscan']);
      }
    })
  }

  navigateToController(UUID: string) {
    this.router.navigate(['mipcontroller', UUID]);
  }
}
