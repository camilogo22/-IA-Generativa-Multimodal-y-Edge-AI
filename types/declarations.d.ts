declare module 'ai' {
  export interface FileUIPart {
    type: 'file';
    mediaType: string;
    filename?: string;
    url: string;
  }
  export interface TextUIPart {
    type: 'text';
    text: string;
  }
  export type UIPart = TextUIPart | FileUIPart | { type: string; [key: string]: any };
  export interface UIMessage {
    id: string;
    role: 'user' | 'assistant' | 'system' | string;
    parts?: UIPart[];
    content?: string;
    createdAt?: Date;
  }
  export class DefaultChatTransport {
    constructor(options: any);
  }
  export function streamText(options: any): any;
  export function generateText(options: any): any;
  export function toUIMessageStream(options: any): any;
  export function createUIMessageStreamResponse(options: any): any;
  export function convertToModelMessages(messages: any): Promise<any>;
  export class APICallError extends Error {
    static isInstance(error: any): error is APICallError;
    statusCode: number;
  }
  export class RetryError extends Error {
    static isInstance(error: any): error is RetryError;
    lastError: any;
  }
  export const Output: any;
}

declare module 'expo-secure-store' {
  export function getItemAsync(key: string, options?: any): Promise<string | null>;
  export function setItemAsync(key: string, value: string, options?: any): Promise<void>;
  export function deleteItemAsync(key: string, options?: any): Promise<void>;
}

declare module 'expo-network' {
  export interface NetworkState {
    isConnected?: boolean;
    isInternetReachable?: boolean;
    type?: string;
  }
  export function useNetworkState(): NetworkState;
  export function getNetworkStateAsync(): Promise<NetworkState>;
}

declare module 'expo-image-picker' {
  export interface ImagePickerOptions {
    mediaTypes?: any[];
    quality?: number;
    allowsEditing?: boolean;
    aspect?: [number, number];
  }
  export interface ImagePickerAsset {
    uri: string;
    width: number;
    height: number;
    base64?: string;
  }
  export interface ImagePickerResult {
    canceled: boolean;
    assets: ImagePickerAsset[];
  }
  export function requestCameraPermissionsAsync(): Promise<{ granted: boolean }>;
  export function requestMediaLibraryPermissionsAsync(): Promise<{ granted: boolean }>;
  export function launchCameraAsync(options?: ImagePickerOptions): Promise<ImagePickerResult>;
  export function launchImageLibraryAsync(options?: ImagePickerOptions): Promise<ImagePickerResult>;
}
