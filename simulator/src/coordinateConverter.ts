import * as Cesium from 'cesium';
import { Vector3 } from '@babylonjs/core';

/**
 * تبدیل مختصات جغرافیایی (WGS84) به مختصات محلی Babylon.js
 */
export class CoordinateConverter {
  private originLongitude: number;
  private originLatitude: number;
  private originHeight: number;
  private originCartesian: Cesium.Cartesian3;

  constructor(originLongitude: number, originLatitude: number, originHeight: number = 0) {
    this.originLongitude = originLongitude;
    this.originLatitude = originLatitude;
    this.originHeight = originHeight;
    this.originCartesian = Cesium.Cartesian3.fromDegrees(
      originLongitude,
      originLatitude,
      originHeight
    );
  }

  /**
   * تبدیل مختصات جغرافیایی به مختصات محلی (ENU - East, North, Up)
   */
  geographicToLocal(longitude: number, latitude: number, height: number = 0): Vector3 {
    const targetCartesian = Cesium.Cartesian3.fromDegrees(longitude, latitude, height);
    
    // محاسبه بردار از origin به target
    const offset = Cesium.Cartesian3.subtract(
      targetCartesian,
      this.originCartesian,
      new Cesium.Cartesian3()
    );

    // تبدیل به سیستم مختصات محلی (ENU)
    const transform = Cesium.Transforms.eastNorthUpToFixedFrame(this.originCartesian);
    const localOffset = Cesium.Matrix4.multiplyByPointAsVector(
      Cesium.Matrix4.inverse(transform, new Cesium.Matrix4()),
      offset,
      new Cesium.Cartesian3()
    );

    // تبدیل به متر (Cesium از متر استفاده می‌کند)
    return new Vector3(
      localOffset.x,
      localOffset.z, // Up در Cesium = Y در Babylon.js
      -localOffset.y // North در Cesium = -Z در Babylon.js
    );
  }

  /**
   * تبدیل مختصات محلی به مختصات جغرافیایی
   */
  localToGeographic(localPosition: Vector3): { longitude: number; latitude: number; height: number } {
    const transform = Cesium.Transforms.eastNorthUpToFixedFrame(this.originCartesian);
    const localCartesian = new Cesium.Cartesian3(
      localPosition.x,
      -localPosition.z, // North
      localPosition.y  // Up
    );
    
    const worldCartesian = Cesium.Matrix4.multiplyByPoint(
      transform,
      localCartesian,
      new Cesium.Cartesian3()
    );

    const cartographic = Cesium.Cartographic.fromCartesian(worldCartesian);
    return {
      longitude: Cesium.Math.toDegrees(cartographic.longitude),
      latitude: Cesium.Math.toDegrees(cartographic.latitude),
      height: cartographic.height
    };
  }
}

