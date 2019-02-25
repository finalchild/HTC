/**
 * 메인 모듈. index.html에서 직접 참조함.
 * @module main
 */

import {listClassIdentifiers, listSubjects, retrieveOptionalSubjects, retrieveSubjectNameMapping, retrieveTimetable, BLANK_LESSON} from './timetable_handler.mjs';

/**
 * 학년 선택 요소.
 * @type {HTMLSelectElement}
 */
const selectGrade = document.getElementById('select-grade');
/**
 * 수업반 선택 요소.
 * @type {HTMLSelectElement}
 */
const selectLectureClass = document.getElementById('select-lecture-class');
/**
 * 학년과 수업반 선택을 마치고 클릭하는 '시간표 만들기' 버튼 요소.
 * @type {HTMLButtonElement}
 */
const submitClass = document.getElementById('submit-class');
/**
 * 선택지와 생성된 시간표를 표시하는 메인 컨테이너 요소.
 * @type {HTMLDivElement}
 */
const mainContainer = document.getElementById('main-container');

/**
 * 학년. '시간표 만들기' 버튼을 클릭하면 넣어 줌. 1학년이면 1이고, 2학년이면 2, 3학년이면 3.
 * @type {number}
 */
let grade;
/**
 * 수업반. '시간표 만들기' 버튼을 클릭하면 넣어 줌. 수업 1반이면 1이고, 수업 2반이면 2, 수업 3반이면 3, 수업 8반이면 8.
 * @type {number}
 */
let lectureClass;

/**
 * 해당 수업반의 전체 시간표. 배열의 식별자는 0부터 시작함. '시간표 만들기' 버튼을 클릭하면 넣어 줌.
 * `timetable[0][0]`은 월요일 1교시에 가능한 수업 목록이고, `timetable[4][5]`는 금요일 6교시에 가능한 수업 목록.
 * @see module:timetable_handler.retrieveTimetable
 * @type {Array<Array<Array<Lesson>>>}
 */
let timetable;
/**
 * 해당 학년에서, 수업반 전체가 같이 듣지 않는 과목명의 목록. '시간표 만들기' 버튼을 클릭하면 넣어 줌.
 * 목록 안의 '---'는 과목 선택 화면에서 표시할 구분선을 의미함.
 * 선택 과목 선택 폼을 만들기 위한 것이며, 폼에 필요하지 않은 과목은 중간에 거름.
 * @see module:timetable_handler/retrieveOptionalSubjects
 * @type {Array<string>}
 */
let optionalSubjects;
/**
 * 시간표를 생성해 표시할 때, 이름이 너무 긴 등의 이유로 다른 이름을 써야 할 경우의 대응 관계. '시간표 만들기' 버튼을 클릭하면 넣어 줌.
 * @see module:timetable_handler/retrieveSubjectNameMapping
 * @type {Array<string>}
 */
let nameMapping;

/**
 * 학년과 수업반을 선택하고 버튼을 눌렀을 때 실행되는 이벤트 리스너.
 */
async function onSubmitClass() {
    // 학년, 수업반 선택 요소 및 '시간표 만들기' 버튼 요소를 비활성화
    selectGrade.disabled = true;
    selectLectureClass.disabled = true;
    submitClass.disabled = true;

    // 선택된 학년과 수업반을 정수로 가져옴
    grade = parseInt(selectGrade.options[selectGrade.selectedIndex].value);
    lectureClass = parseInt(selectLectureClass.options[selectLectureClass.selectedIndex].value);

    // 해당 학년과 수업반의 시간표, 선택 과목 목록, 이름 대응 관계를 가져오기
    // `Promise.all`은 그 안에 있는 작업이 모두 완료되기를 기다리는 비동기 함수임
    [
        timetable,
        optionalSubjects,
        nameMapping
    ] = await Promise.all([
        retrieveTimetable(grade, lectureClass),
        retrieveOptionalSubjects(grade),
        retrieveSubjectNameMapping()
    ]);

    // 해당 수업반에서 수강할 수 있는 과목의 목록을 가져옴
    const subjects = listSubjects(timetable);

    // 선택 과목의 목록 중에서, 해당 수업반에서 수강할 수 있는 것만 골라냄. 구분선은 남겨 둠
    // `Array.prototype.filter`는 해당 조건을 만족하는 원소만 골라내는 메서드임.
    optionalSubjects = optionalSubjects.filter(subject => subjects.includes(subject) || subject === '---');
    
    // 시작이나 끝에 구분선이 있으면 없애고, 구분선이 연속해 있는 경우 하나만 남김.
    for (let i = 0; i < optionalSubjects.length; i++) {
        while ((i === 0 || optionalSubjects[i - 1] === '---') && optionalSubjects[i] === '---') {
            optionalSubjects.splice(i, 1);
        }
    }
    if (optionalSubjects.length !== 0 && optionalSubjects[optionalSubjects.length - 1] === '---') {
        optionalSubjects.pop();
    }

    await createMainForm(); // 선택 과목을 물어 보는 메인 폼을 표시
}

submitClass.addEventListener('click', onSubmitClass); // onSubmitClass 이벤트 리스너 등록

/**
 * 선택 과목을 물어 보는 메인 폼을 표시.
 */
async function createMainForm() {
    const box = document.createElement('div');
    box.classList.add('box');
    box.id = 'main-form-box';
    const field = document.createElement('div');
    field.classList.add('field');
    for (const subject of optionalSubjects) {
        if (subject === '---') {
            const hr = document.createElement('hr');
            hr.classList.add('main-form-divider');
            field.append(hr);
            continue;
        }

        const subjectHyphenated = subject.replace(/ /g, '-');

        const checkboxDiv = document.createElement('div');
        checkboxDiv.classList.add('checkbox-div');

        const checkbox = document.createElement('input');
        checkbox.classList.add('is-checkradio', 'is-medium', 'checkbox-subject');
        checkbox.type = 'checkbox';
        checkbox.id = `checkbox-${subjectHyphenated}`;
        checkbox.name = `checkbox-${subjectHyphenated}`;
        checkbox.value = subject;
        checkboxDiv.append(checkbox);

        const label = document.createElement('label');
        label.classList.add('checkbox-label');
        label.htmlFor = `checkbox-${subjectHyphenated}`;
        label.append(subject);
        checkboxDiv.append(label);

        const classIdentifiers = listClassIdentifiers(timetable, subject);
        if (classIdentifiers.length > 1) {
            const selectDiv = document.createElement('div');
            selectDiv.classList.add('select', 'is-primary');
            const select = document.createElement('select');
            select.classList.add('select-subject');
            select.id = `select-${subjectHyphenated}`;
            for (const classIdentifier of classIdentifiers.sort()) {
                const option = document.createElement('option');
                option.value = classIdentifier;
                option.text = `${classIdentifier}반`;
                select.add(option);
            }
            selectDiv.append(select);
            checkboxDiv.append(selectDiv);

            // 반 식별자를 선택했을 때, 수업 요일과 교시를 표시해 주는 텍스트 만들기
            const classTimeInfo = document.createElement('span');
            classTimeInfo.classList.add('class-time-info');
            classTimeInfo.id = `class-time-info-${subject.replace(' ', '-')}`;
            classTimeInfo.append('');
            checkboxDiv.append(classTimeInfo);

            selectDiv.style.display = 'none';

            checkbox.addEventListener('change', e => {
                if (checkbox.checked) {
                    selectDiv.style.display = 'inline-block';
                    classTimeInfo.style.display = 'inline-block';
                    updateClassTimeInfo();
                } else {
                    selectDiv.style.display = 'none';
                    classTimeInfo.style.display = 'none';
                }
            });
            select.addEventListener('change', updateClassTimeInfo);

            /**
             * 반 식별자를 선택했을 때, 수업 요일과 교시를 표시해 주는 텍스트를 갱신하는 내부 함수.
             */
            function updateClassTimeInfo() {
                classTimeInfo.innerHTML = '';
                for (let dayOfWeek = 0; dayOfWeek < 5; dayOfWeek++) {
                    for (let period = 0; period < 6; period++) {
                        // 과목명과 반 식별자가 일치하면 그 요일과 교시를 `classTimeInfo`에 추가해 준다.
                        timetable[dayOfWeek][period].filter(lesson => lesson.subject === subject && lesson.classIdentifier === select.value).forEach(lesson => {
                            if (classTimeInfo.innerHTML !== '') classTimeInfo.innerHTML += '/';
                            switch (dayOfWeek) {
                                case 0:
                                classTimeInfo.innerHTML += '월';
                                break;
                                case 1:
                                classTimeInfo.innerHTML += '화';
                                break;
                                case 2:
                                classTimeInfo.innerHTML += '수';
                                break;
                                case 3:
                                classTimeInfo.innerHTML += '목';
                                break;
                                case 4:
                                classTimeInfo.innerHTML += '금';
                            }
                            classTimeInfo.innerHTML += period + 1;
                        });
                    }
                }
            }

            // 수학과 영어 분반 수업은 과목 자체는 선택 해제할 수 없음. 반 식별자만 변경 가능함.
            if (subject === '수학' || subject === '영어') {
                checkbox.checked = true;
                checkbox.dispatchEvent(new Event('change'));
                checkbox.disabled = true;
                classTimeInfo.style.display = 'none';
            }
        }

        field.append(checkboxDiv);
    }
    box.append(field);

    // 선택 완료 버튼 만들기
    const button = document.createElement('button');
    button.classList.add('button', 'is-primary');
    button.id = 'submit-main-form';
    button.append('선택 완료');
    button.addEventListener('click', onSubmitMainForm);
    box.append(button);

    mainContainer.append(box);
}

/**
 * 선택 과목 선택 메인 폼에서 '선택 완료' 버튼을 눌렀을 때 실행되는 이벤트 리스너.
 */
async function onSubmitMainForm() {
    const selected = Array.from(document.getElementsByClassName('checkbox-subject'))
    .filter(checkbox => checkbox.checked)
    .map(checkbox => {
        const subject = checkbox.value;
        const classIdentifiers = listClassIdentifiers(timetable, subject);
        let classIdentifier;
        if (classIdentifiers.length === 1) {
            classIdentifier = classIdentifiers[0];
        } else {
            const select = document.getElementById(`select-${subject.replace(/ /g, '-')}`);
            classIdentifier = select.value;
        }
        return subject + (classIdentifier === null ? '' : classIdentifier);
    });

    const table = document.createElement('table');
    table.classList.add('table', 'is-bordered', 'is-striped');
    {
        const thead = table.createTHead();
        const tr = document.createElement('tr');
        const th0 = document.createElement('th');
        th0.classList.add('timetable-top-left');
        tr.append(th0);
        const th1 = document.createElement('th');
        th1.classList.add('timetable-top');
        th1.append('월');
        tr.append(th1);
        const th2 = document.createElement('th');
        th2.classList.add('timetable-top');
        th2.append('화');
        tr.append(th2);
        const th3 = document.createElement('th');
        th3.classList.add('timetable-top');
        th3.append('수');
        tr.append(th3);
        const th4 = document.createElement('th');
        th4.classList.add('timetable-top');
        th4.append('목');
        tr.append(th4);
        const th5 = document.createElement('th');
        th5.classList.add('timetable-top');
        th5.append('금');
        tr.append(th5);
        thead.append(tr);
    }
    {
        for (let period = 0; period < 6; period++) {
            const row = table.insertRow();
            const th = document.createElement('th');
            th.classList.add('timetable-left');
            th.append(period + 1);
            row.append(th);
            for (let dayOfWeek = 0; dayOfWeek < 5; dayOfWeek++) {
                const lessons = timetable[dayOfWeek][period];
                let lesson;
                if (lessons.length === 1 && !optionalSubjects.includes(lessons[0].subject)) {
                    lesson = lessons[0];
                } else {
                    const filteredLessons = lessons.filter(lesson => selected.includes(lesson.subjectWithClassIdentifier));
                    switch (filteredLessons.length) {
                        case 0:
                            lesson = BLANK_LESSON;
                            break;
                        case 1:
                            lesson = filteredLessons[0];
                            break;
                        default:
                            const existing = document.getElementById('error-notification');
                            if (existing) {
                                existing.parentNode.removeChild(existing);
                            }
                            const notification = document.createElement('div');
                            notification.classList.add('notification', 'is-warning');
                            notification.id = 'error-notification';
                            const deleteButton = document.createElement('button');
                            deleteButton.classList.add('delete');
                            deleteButton.addEventListener('click', e => {
                                mainContainer.removeChild(notification);
                            });
                            notification.append(deleteButton);
                            const filteredLessonsString = filteredLessons.
                                map(lesson => lesson.subjectWithClassIdentifier).join(', ');
                            notification.append('시간 충돌이 있습니다!\n' + filteredLessonsString + '은(는) 동시에 선택할 수 없습니다!');
                            mainContainer.append(notification);
                            return;
                    }
                }

                const cell = row.insertCell();
                cell.classList.add('timetable-cell');
                if (lesson.subject.startsWith('자율')) {
                    cell.append('자율');
                } else if (lesson.subject.startsWith('동아리/행사')) {
                    cell.append('동아리');
                } else if (nameMapping.has(lesson.subject)) {
                    cell.append(nameMapping.get(lesson.subject));
                } else {
                    cell.append(lesson.subject);
                }
                if (lesson.teacher !== null && lesson.teacher !== '담임') {
                    const teacherSpan = document.createElement('span');
                    teacherSpan.classList.add('teacher');
                    teacherSpan.append(lesson.teacher);
                    cell.append(document.createElement('br'), teacherSpan);
                }
                if (lesson.room !== null && lesson.room !== '하우스') {
                    const roomSpan = document.createElement('span');
                    roomSpan.classList.add('room');
                    roomSpan.append(lesson.room);
                    cell.append(document.createElement('br'), roomSpan);
                }
                if (lesson.subject === '공강') {
                    cell.classList.add('empty-lesson');
                }
                if (lesson.room === '하우스') {
                    cell.classList.add('house-lesson')
                }
            }
        }
    }
    document.getElementById('main-form-box').style.display = 'none';
    mainContainer.append(table);
}
