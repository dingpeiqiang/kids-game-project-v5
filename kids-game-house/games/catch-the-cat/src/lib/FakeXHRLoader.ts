/**
 * Modified from "phaser/src/loader/XHRLoader.js"
 */

import FakeXMLHttpRequest from "./fake-xml-http-request";
import RawFile from "./RawFile";

export default function FakeXHRLoader(file: RawFile, config: XHRSettingsObject): XMLHttpRequest {
    /**
     * @link https://github.com/pretenderjs/FakeXMLHttpRequest/blob/master/src/fake-xml-http-request.js
     */
    var xhr = new FakeXMLHttpRequest();

    xhr.open("GET", file.src, config.async, config.user, config.password);

    xhr.responseType = file.xhrSettings.responseType;
    xhr.timeout = config.timeout;

    if (config.header && config.headerValue) {
        xhr.setRequestHeader(config.header, config.headerValue);
    }

    if (config.requestedWith) {
        xhr.setRequestHeader("X-Requested-With", config.requestedWith);
    }

    if (config.overrideMimeType) {
        xhr.overrideMimeType(config.overrideMimeType);
    }

    // After a successful request, the xhr.response property will contain the requested data as a DOMString, ArrayBuffer, Blob, or Document (depending on what was set for responseType.)

    xhr.onload = file.onLoad.bind(file, xhr);
    xhr.onerror = file.onError.bind(file);
    xhr.onprogress = file.onProgress.bind(file);

    //  This is the only standard method, the ones above are browser additions (maybe not universal?)
    // xhr.onreadystatechange

    xhr.send();

    setTimeout(() => {
        // 对于 SVG 文件，需要解析为 DOM 元素
        let responseBody: any;
        
        if (file.rawData === null || file.rawData === undefined) {
            responseBody = "";
        } else if (typeof file.rawData === "string") {
            // 检查是否是 SVG 文件
            const isSVG = file.key && typeof file.key === 'string' && 
                         (file.key.endsWith('.svg') || file.type === 'svg');
            
            if (isSVG && typeof document !== 'undefined') {
                try {
                    // 将 SVG 字符串解析为 DOM 元素
                    const parser = new DOMParser();
                    const doc = parser.parseFromString(file.rawData, 'image/svg+xml');
                    const svgElement = doc.documentElement;
                    
                    // 检查解析是否成功
                    const parseError = doc.querySelector('parsererror');
                    if (!parseError && svgElement) {
                        responseBody = svgElement;
                    } else {
                        console.warn('Failed to parse SVG, using raw string');
                        responseBody = file.rawData;
                    }
                } catch (e) {
                    console.warn('SVG parsing error:', e);
                    responseBody = file.rawData;
                }
            } else {
                responseBody = file.rawData;
            }
        } else {
            try {
                // 尝试 toString
                if (typeof (file.rawData as any).toString === "function") {
                    const str = (file.rawData as any).toString();
                    
                    // 如果是 SVG 字符串，尝试解析
                    const isSVG = file.key && typeof file.key === 'string' && 
                                 (file.key.endsWith('.svg') || file.type === 'svg');
                    
                    if (isSVG && str.includes('<svg') && typeof document !== 'undefined') {
                        try {
                            const parser = new DOMParser();
                            const doc = parser.parseFromString(str, 'image/svg+xml');
                            const svgElement = doc.documentElement;
                            const parseError = doc.querySelector('parsererror');
                            if (!parseError && svgElement) {
                                responseBody = svgElement;
                            } else {
                                responseBody = str;
                            }
                        } catch (parseErr) {
                            responseBody = str;
                        }
                    } else {
                        responseBody = str;
                    }
                } else {
                    // 最后手段：JSON.stringify
                    responseBody = JSON.stringify(file.rawData);
                }
            } catch (e) {
                console.warn("Failed to convert rawData:", e);
                responseBody = "";
            }
        }
        
        xhr.respond(200, {"Content-Type": "application/octet-stream"}, responseBody);
    }, 1);

    return xhr;
};
