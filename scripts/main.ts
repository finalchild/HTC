/**
 * index.html에서 직접 참조하는 메인 모듈.
 * 시간표 생성 과정은 timetable_logic.mjs에서 담당하므로, 핵심 로직은 그 모듈에 있음.
 * @module main
 */

import {onSubmitClass} from './timetable_logic'
import {openOverflowModal, closeOverflowModal} from './util';

document.getElementById('submit-class').addEventListener('click', onSubmitClass);

document.getElementById('overflow-anchor').addEventListener('click', openOverflowModal);

document.getElementById('close-overflow-modal').addEventListener('click', closeOverflowModal);

document.getElementById('overflow-modal-background').addEventListener('click', closeOverflowModal);
