/**
 * Camera utilities for mobile QR scanning
 * Handles camera permissions, device capabilities, and mobile optimizations
 */

// Extended interfaces for advanced camera features
interface ExtendedMediaTrackCapabilities extends MediaTrackCapabilities {
	torch?: boolean;
	focusMode?: string[];
}

interface ExtendedMediaTrackConstraintSet extends MediaTrackConstraintSet {
	torch?: boolean;
	focusMode?: string;
}

export interface CameraCapabilities {
	hasCamera: boolean;
	hasMultipleCameras: boolean;
	supportsFacingMode: boolean;
	supportsFlash: boolean;
	supportsFocus: boolean;
}

export interface CameraError {
	code: string;
	message: string;
	type: 'permission' | 'hardware' | 'not-supported' | 'unknown';
}

export class CameraUtils {
	private static instance: CameraUtils;
	private mediaStream: MediaStream | null = null;
	private capabilities: CameraCapabilities | null = null;

	private constructor() {}

	static getInstance(): CameraUtils {
		if (!CameraUtils.instance) {
			CameraUtils.instance = new CameraUtils();
		}
		return CameraUtils.instance;
	}

	/**
	 * Check if camera is available
	 */
	async isCameraAvailable(): Promise<boolean> {
		try {
			if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
				return false;
			}

			// Check if we can enumerate devices (might require permission)
			const devices = await navigator.mediaDevices.enumerateDevices();
			return devices.some((device) => device.kind === 'videoinput');
		} catch (error) {
			console.warn('Could not check camera availability:', error);
			return false;
		}
	}

	/**
	 * Request camera permission and access
	 */
	async requestCameraAccess(
		facingMode: 'user' | 'environment' = 'environment'
	): Promise<MediaStream> {
		try {
			// Stop any existing stream first
			await this.stopCamera();

			const constraints: MediaStreamConstraints = {
				video: {
					facingMode: { ideal: facingMode },
					width: { ideal: 1280, max: 1920 },
					height: { ideal: 720, max: 1080 }
				},
				audio: false
			};

			this.mediaStream = await navigator.mediaDevices.getUserMedia(constraints);
			return this.mediaStream;
		} catch (error) {
			throw this.handleCameraError(error);
		}
	}

	/**
	 * Get camera capabilities
	 */
	async getCameraCapabilities(): Promise<CameraCapabilities> {
		if (this.capabilities) {
			return this.capabilities;
		}

		try {
			const hasCamera = await this.isCameraAvailable();
			if (!hasCamera) {
				this.capabilities = {
					hasCamera: false,
					hasMultipleCameras: false,
					supportsFacingMode: false,
					supportsFlash: false,
					supportsFocus: false
				};
				return this.capabilities;
			}

			const devices = await navigator.mediaDevices.enumerateDevices();
			const videoDevices = devices.filter((device) => device.kind === 'videoinput');

			// Try to get a stream to check advanced capabilities
			let stream: MediaStream | null = null;
			let videoTrack: MediaStreamTrack | null = null;

			try {
				stream = await navigator.mediaDevices.getUserMedia({ video: true });
				videoTrack = stream.getVideoTracks()[0];
			} catch (error) {
				console.warn('Could not get video stream for capabilities check:', error);
			}

			this.capabilities = {
				hasCamera: true,
				hasMultipleCameras: videoDevices.length > 1,
				supportsFacingMode: this.checkFacingModeSupport(videoTrack),
				supportsFlash: this.checkFlashSupport(videoTrack),
				supportsFocus: this.checkFocusSupport(videoTrack)
			};

			// Clean up test stream
			if (stream) {
				stream.getTracks().forEach((track) => track.stop());
			}

			return this.capabilities;
		} catch (error) {
			console.error('Error checking camera capabilities:', error);
			this.capabilities = {
				hasCamera: false,
				hasMultipleCameras: false,
				supportsFacingMode: false,
				supportsFlash: false,
				supportsFocus: false
			};
			return this.capabilities;
		}
	}

	/**
	 * Switch camera (front/back)
	 */
	async switchCamera(): Promise<MediaStream> {
		const capabilities = await this.getCameraCapabilities();
		if (!capabilities.hasMultipleCameras) {
			throw new Error('Device does not have multiple cameras');
		}

		// Determine current facing mode and switch
		const currentFacingMode = this.getCurrentFacingMode();
		const newFacingMode = currentFacingMode === 'user' ? 'environment' : 'user';

		return this.requestCameraAccess(newFacingMode);
	}

	/**
	 * Enable/disable flashlight (if supported)
	 */
	async toggleFlash(enable: boolean): Promise<boolean> {
		if (!this.mediaStream) {
			throw new Error('No active camera stream');
		}

		const videoTrack = this.mediaStream.getVideoTracks()[0];
		if (!videoTrack) {
			throw new Error('No video track available');
		}

		try {
			const capabilities = videoTrack.getCapabilities() as ExtendedMediaTrackCapabilities;
			if (!capabilities.torch) {
				throw new Error('Flash not supported on this device');
			}

			await videoTrack.applyConstraints({
				advanced: [{ torch: enable } as ExtendedMediaTrackConstraintSet]
			});

			return true;
		} catch (error) {
			console.error('Failed to toggle flash:', error);
			return false;
		}
	}

	/**
	 * Focus camera (if supported)
	 */
	async focusCamera(): Promise<boolean> {
		if (!this.mediaStream) {
			throw new Error('No active camera stream');
		}

		const videoTrack = this.mediaStream.getVideoTracks()[0];
		if (!videoTrack) {
			throw new Error('No video track available');
		}

		try {
			const capabilities = videoTrack.getCapabilities() as ExtendedMediaTrackCapabilities;
			if (!capabilities.focusMode) {
				return false;
			}

			await videoTrack.applyConstraints({
				advanced: [{ focusMode: 'single-shot' } as ExtendedMediaTrackConstraintSet]
			});

			return true;
		} catch (error) {
			console.error('Failed to focus camera:', error);
			return false;
		}
	}

	/**
	 * Stop camera stream
	 */
	async stopCamera(): Promise<void> {
		if (this.mediaStream) {
			this.mediaStream.getTracks().forEach((track) => track.stop());
			this.mediaStream = null;
		}
	}

	/**
	 * Get current camera stream
	 */
	getCurrentStream(): MediaStream | null {
		return this.mediaStream;
	}

	/**
	 * Check if camera permission is granted
	 */
	async checkCameraPermission(): Promise<'granted' | 'denied' | 'prompt'> {
		try {
			if (!navigator.permissions) {
				return 'prompt';
			}

			const result = await navigator.permissions.query({ name: 'camera' as PermissionName });
			return result.state as 'granted' | 'denied' | 'prompt';
		} catch (error) {
			console.warn('Could not check camera permission:', error);
			return 'prompt';
		}
	}

	/**
	 * Detect if device is mobile
	 */
	isMobileDevice(): boolean {
		return /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(
			navigator.userAgent
		);
	}

	/**
	 * Get optimal video constraints for mobile
	 */
	getMobileVideoConstraints(): MediaTrackConstraints {
		const isMobile = this.isMobileDevice();

		if (isMobile) {
			return {
				facingMode: { ideal: 'environment' },
				width: { ideal: 1280, max: 1920 },
				height: { ideal: 720, max: 1080 },
				frameRate: { ideal: 30, max: 30 }
			};
		}

		return {
			width: { ideal: 640, max: 1280 },
			height: { ideal: 480, max: 720 },
			frameRate: { ideal: 30, max: 60 }
		};
	}

	/**
	 * Private helper methods
	 */
	private getCurrentFacingMode(): 'user' | 'environment' {
		if (!this.mediaStream) {
			return 'environment';
		}

		const videoTrack = this.mediaStream.getVideoTracks()[0];
		if (!videoTrack) {
			return 'environment';
		}

		const settings = videoTrack.getSettings();
		return (settings.facingMode as 'user' | 'environment') || 'environment';
	}

	private checkFacingModeSupport(videoTrack: MediaStreamTrack | null): boolean {
		if (!videoTrack) return false;

		try {
			const capabilities = videoTrack.getCapabilities();
			return !!capabilities.facingMode;
		} catch {
			return false;
		}
	}

	private checkFlashSupport(videoTrack: MediaStreamTrack | null): boolean {
		if (!videoTrack) return false;

		try {
			const capabilities = videoTrack.getCapabilities() as ExtendedMediaTrackCapabilities;
			return !!capabilities.torch;
		} catch {
			return false;
		}
	}

	private checkFocusSupport(videoTrack: MediaStreamTrack | null): boolean {
		if (!videoTrack) return false;

		try {
			const capabilities = videoTrack.getCapabilities() as ExtendedMediaTrackCapabilities;
			return !!capabilities.focusMode;
		} catch {
			return false;
		}
	}

	private handleCameraError(error: unknown): CameraError {
		if (error instanceof DOMException) {
			switch (error.name) {
				case 'NotAllowedError':
					return {
						code: 'PERMISSION_DENIED',
						message:
							'Camera access denied. Please allow camera permission in your browser settings.',
						type: 'permission'
					};
				case 'NotFoundError':
					return {
						code: 'NO_CAMERA',
						message: 'No camera found on this device.',
						type: 'hardware'
					};
				case 'NotSupportedError':
					return {
						code: 'NOT_SUPPORTED',
						message: 'Camera access is not supported in this browser.',
						type: 'not-supported'
					};
				case 'OverconstrainedError':
					return {
						code: 'CONSTRAINTS_ERROR',
						message: 'Camera constraints cannot be satisfied. Try a different camera.',
						type: 'hardware'
					};
				case 'SecurityError':
					return {
						code: 'SECURITY_ERROR',
						message: 'Camera access blocked due to security policy.',
						type: 'permission'
					};
				default:
					return {
						code: 'UNKNOWN_ERROR',
						message: error.message || 'Unknown camera error occurred.',
						type: 'unknown'
					};
			}
		}

		return {
			code: 'UNKNOWN_ERROR',
			message: 'An unexpected error occurred while accessing the camera.',
			type: 'unknown'
		};
	}
}

// Export instance
export const cameraUtils = CameraUtils.getInstance();

/**
 * Utility functions for mobile optimization
 */
export function isMobileBrowser(): boolean {
	return /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);
}

export function isIOSBrowser(): boolean {
	return /iPad|iPhone|iPod/.test(navigator.userAgent);
}

export function isAndroidBrowser(): boolean {
	return /Android/.test(navigator.userAgent);
}

export function supportsPWA(): boolean {
	return 'serviceWorker' in navigator && 'PushManager' in window;
}

export function isStandalone(): boolean {
	return (
		window.matchMedia('(display-mode: standalone)').matches ||
		(window.navigator as { standalone?: boolean }).standalone === true
	);
}

/**
 * Haptic feedback for mobile devices (if supported)
 */
export function vibrate(pattern: number | number[] = 100): boolean {
	if (!navigator.vibrate) {
		return false;
	}

	try {
		navigator.vibrate(pattern);
		return true;
	} catch (error) {
		console.warn('Vibration not supported:', error);
		return false;
	}
}
