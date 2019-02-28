/**
 * index.html에서 직접 참조하는 메인 모듈.
 * 시간표 생성 과정은 timetable_logic.mjs에서 담당하므로, 핵심 로직은 그 모듈에 있음.
 * @module main
 */

// import 'core-js/es6/promise';
import 'whatwg-fetch';
import 'mdn-polyfills/Node.prototype.append';
import 'events-polyfill';
import 'blob';
import 'canvas-toBlob';
import {onSubmitClass} from './timetable_logic';
import {openOverflowModal, closeOverflowModal} from './util';

document.getElementById('submit-class')!.addEventListener('click', onSubmitClass);

document.getElementById('overflow-anchor')!.addEventListener('click', openOverflowModal);

document.getElementById('close-overflow-modal')!.addEventListener('click', closeOverflowModal);

document.getElementById('overflow-modal-background')!.addEventListener('click', closeOverflowModal);
