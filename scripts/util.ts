/**
 * 모달(오버플로 소개글), 과목 선택 오류 알림에 관련된 유틸리티 함수를 제공하는 모듈.
 * @module util
 */

 /**
  * 오버플로 모달(오버플로 소개글)을 열어 표시.
  */
export function openOverflowModal(): void {
    document.getElementById('overflow-modal-container').classList.add('is-active');
}

 /**
  * 오버플로 모달(오버플로 소개글)을 닫음.
  */
export function closeOverflowModal(): void {
    document.getElementById('overflow-modal-container').classList.remove('is-active');
}

/**
 * 과목 선택 오류 알림을 표시.
 * 이미 오류 알림이 있으면 이전 알림은 제거함.
 * 
 * @param message - 오류 메시지.
 */
export function showErrorNotification(message: string): void {
    const mainContainer = document.getElementById('main-container');
    removeErrorNotification();
    const notification = document.createElement('div');
    notification.classList.add('notification', 'is-warning');
    notification.id = 'error-notification';
    const deleteButton = document.createElement('button');
    deleteButton.classList.add('delete');
    deleteButton.addEventListener('click', e => {
        mainContainer.removeChild(notification);
    });
    notification.append(deleteButton);
    notification.append(message);
    mainContainer.append(notification);
}

/**
 * 과목 선택 오류 알림을 제거.
 */
export function removeErrorNotification(): void {
    const existing = document.getElementById('error-notification');
    if (existing) {
        existing.parentNode.removeChild(existing);
    }
}
