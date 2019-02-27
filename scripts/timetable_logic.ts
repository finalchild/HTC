/**
 * 시간표 생성 과정을 담당하는 모듈.
 * main.mjs에서 onSubmitClass를 이벤트 리스너로 등록함.
 * @module timetable_logic
 */

import html2canvas from 'html2canvas';
import {Lesson, listClassIdentifiers, listSubjects, retrieveOptionalSubjects, retrieveSubjectNameMapping, retrieveTimetable, BLANK_LESSON, retrieveKjColors} from './timetable_handler';
import {showErrorNotification, removeErrorNotification} from './util';

/**
 * 학년. '시간표 만들기' 버튼을 클릭하면 넣어 줌. 1학년이면 1이고, 2학년이면 2, 3학년이면 3.
 */
let grade: number;
/**
 * 수업반. '시간표 만들기' 버튼을 클릭하면 넣어 줌. 수업 1반이면 1이고, 수업 2반이면 2, 수업 3반이면 3, 수업 8반이면 8.
 */
let lectureClass: number;

/**
 * 해당 수업반의 전체 시간표. 배열의 식별자는 0부터 시작함. '시간표 만들기' 버튼을 클릭하면 넣어 줌.
 * `timetable[0][0]`은 월요일 1교시에 가능한 수업 목록이고, `timetable[4][5]`는 금요일 6교시에 가능한 수업 목록.
 * @see module:timetable_handler.retrieveTimetable
 */
let timetable: Array<Array<Array<Lesson>>>;
/**
 * 시간표를 생성해 표시할 때, 이름이 너무 긴 등의 이유로 다른 이름을 써야 할 경우의 대응 관계. '시간표 만들기' 버튼을 클릭하면 넣어 줌.
 * 
 * @see module:timetable_handler/retrieveSubjectNameMapping
 */
let nameMapping: Map<string, string>;
/**
 * 해당 학년에서, 수업반 전체가 같이 듣지 않는 과목명의 목록. '시간표 만들기' 버튼을 클릭하면 넣어 줌.
 * 목록 안의 '---'는 과목 선택 화면에서 표시할 구분선을 의미함.
 * 선택 과목 선택 폼을 만들기 위한 것이며, 폼에 필요하지 않은 과목은 중간에 거름.
 * 
 * @see module:timetable_handler/retrieveOptionalSubjects
 */
let optionalSubjects: Array<string>;
/**
 * 과목에서 색을 반환하는 함수. '시간표 만들기' 버튼을 클릭하면 넣어 줌.
 * kj는 경준의 약자임.
 * 
 * @see module:timetable_handler/retrieveKjColors
 */
let kjColors: (subject: string) => string;

const defaultColors: (subject: string) => string = subject => {
    if (subject.includes('공강')) {
        return '#9197b5';
    } else if (subject.includes('자율') || subject.includes('동아리')) {
        return '#acc189'
    } else {
        return '#ffffff'
    }
}

/**
 * 학년과 수업반을 선택하고 버튼을 눌렀을 때 실행되는 이벤트 리스너.
 */
export async function onSubmitClass() {
    const selectGrade = <HTMLSelectElement>document.getElementById('select-grade');
    const selectLectureClass = <HTMLSelectElement>document.getElementById('select-lecture-class');
    const submitClass = <HTMLButtonElement>document.getElementById('submit-class');

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
        nameMapping,
        kjColors
    ] = await Promise.all([
        retrieveTimetable(grade, lectureClass),
        retrieveOptionalSubjects(grade),
        retrieveSubjectNameMapping(),
        retrieveKjColors()
    ]);

    // 해당 수업반에서 수강할 수 있는 과목의 목록을 가져옴
    const subjects = listSubjects(timetable);

    // 선택 과목의 목록 중에서, 해당 수업반에서 수강할 수 있는 것만 골라냄. 구분선은 남겨 둠
    // `Array.prototype.filter`는 해당 조건을 만족하는 원소만 골라내는 메서드임
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

/**
 * 선택 과목을 물어 보는 메인 폼을 표시.
 */
export async function createMainForm(): Promise<void> {
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
            
            /**
             * 반 식별자를 선택했을 때, 수업 요일과 교시를 표시해 주는 텍스트를 갱신하는 내부 함수.
             */
            const updateClassTimeInfo = () => {
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
                            classTimeInfo.innerHTML += (period + 1).toString();
                        });
                    }
                }
            }

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

    document.getElementById('main-container')!.append(box);
}

/**
 * 선택 과목 선택 메인 폼에서 '선택 완료' 버튼을 눌렀을 때 실행되는 이벤트 리스너.
 */
export async function onSubmitMainForm(): Promise<void> {
    const checkboxes = <Array<HTMLInputElement>>Array.from(document.getElementsByClassName('checkbox-subject'));
    const subjects = checkboxes.map(checkbox => checkbox.value);
    const checkedSubjects = checkboxes.filter(checkbox => checkbox.checked).map(checkbox => checkbox.value);

    /**
     * 선택한, 반 식별자를 붙인 과목명의 목록.
     * 체크박스 중에서 선택한 것들만 골라낸 뒤 추가 작업을 해 만듬.
     */
    const checkedSubjectsWithClassIdentifier: Array<string> = checkedSubjects.map(subject => {
        const classIdentifiers = listClassIdentifiers(timetable, subject);
        let classIdentifier;
        // 가능한 반 식별자가 하나밖에 없으면 그것으로 결정. 여러 개가 있으면 드롭다운 리스트에서 선택한 반 식별자를 사용.
        if (classIdentifiers.length === 1) {
            classIdentifier = classIdentifiers[0];
        } else {
            const select = <HTMLSelectElement>document.getElementById(`select-${subject.replace(/ /g, '-')}`);
            classIdentifier = select.value;
        }

        // 반 식별자를 붙인 과목명으로 만듬.
        return subject + (classIdentifier === null ? '' : classIdentifier);
    });

    // 스포츠과학과 스포츠문화가 있는데 둘 모두 선택하지 않았을 경우 오류
    // 단, 과목을 하나도 선택하지 않고 필수 과목 시간표만 보는 경우가 있으므로 그 경우는 오류로 판정하지 않음
    if (checkedSubjects.length !== 0 && subjects.includes('스포츠과학') && subjects.includes('스포츠문화') && !checkedSubjects.includes('스포츠과학') && !checkedSubjects.includes('스포츠문화')) {
        showErrorNotification('스포츠과학과 스포츠문화 중 하나는 선택해야 합니다. 남자는 스포츠과학, 여자는 스포츠문화입니다.');
        return;
    }

    /**
     * 완성된 개인 시간표 정보. 배열의 식별자는 0부터 시작함.
     * `personalTimetable[0][0]`은 월요일 1교시에 듣는 수업, `personalTimetable[4][5]`는 금요일 6교시에 듣는 수업.
     */
    const personalTimetable: Array<Array<Lesson>> = [];
    for (let dayOfWeek = 0; dayOfWeek < 5; dayOfWeek++) {
        // 2차원 배열이므로 안에 배열을 넣어 줘야 함
        personalTimetable[dayOfWeek] = [];

        for (let period = 0; period < 6; period++) {
            const lessons = timetable[dayOfWeek][period];

            // 해당 교시에 들을 수 있는 과목이 하나밖에 없고, 그 과목이 선택 과목이 아니면 (필수 과목이면)
            if (lessons.length === 1 && !optionalSubjects.includes(lessons[0].subject)) {
                // 그 과목을 넣음
                personalTimetable[dayOfWeek][period] = lessons[0];
            // 그런 경우가 아니면
            } else {
                // 들을 수 있는 과목 중에 선택한 과목만 골라냄
                const filteredLessons = lessons.filter(lesson => checkedSubjectsWithClassIdentifier.includes(lesson.subjectWithClassIdentifier));
                switch (filteredLessons.length) {
                    case 0:
                        // 골라낸 것이 0개이면 공강
                        personalTimetable[dayOfWeek][period] = BLANK_LESSON;
                        break;
                    case 1:
                        // 골라낸 것이 1개이면 그 과목 수강
                        personalTimetable[dayOfWeek][period] = filteredLessons[0];
                        break;
                    default:
                        // 2개 이상이면 오류
                        const filteredLessonsString = filteredLessons.map(lesson => lesson.subjectWithClassIdentifier).join(', ');
                        showErrorNotification('시간 충돌이 있습니다!\n' + filteredLessonsString + ' 수업은 동시에 선택할 수 없습니다!');
                        return;
                }
            }
        }
    }

    // 개인 시간표 정보를 바탕으로 개인 시간표를 만들어 표시
    renderPersonalTimetable(personalTimetable);
}

/**
 * 개인 시간표를 보여 줌.
 * @param personalTimetable - 완성된 개인 시간표 정보. 배열의 식별자는 0부터 시작함. `personalTimetable[0][0]`은 월요일 1교시에 듣는 수업, `personalTimetable[4][5]`는 금요일 6교시에 듣는 수업.
 */
export function renderPersonalTimetable(personalTimetable: Array<Array<Lesson>>) {
    const mainContainer = document.getElementById('main-container')!;

    // 학년/수업반 선택, 메인 폼, 오류 알림 제거
    document.getElementById('lecture-class-control')!.style.display = 'none';
    document.getElementById('main-form-box')!.style.display = 'none';
    removeErrorNotification();

    // 표의 시작
    const table = document.createElement('table');
    table.classList.add('table', 'is-bordered', 'is-striped');
    document.getElementById('main-container')!.append(table);

    const thead = table.createTHead();
    const tr = document.createElement('tr');
    thead.append(tr);
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

    for (let period = 0; period < 6; period++) {
        const row = table.insertRow();
        const th = document.createElement('th');
        th.classList.add('timetable-left');
        th.append((period + 1).toString());
        row.append(th);
        for (let dayOfWeek = 0; dayOfWeek < 5; dayOfWeek++) {
            const lesson = personalTimetable[dayOfWeek][period];

            const cell = row.insertCell();
            cell.classList.add('timetable-cell');

            // 과목명을 변형할 필요가 있으면 변형
            if (lesson.subject.startsWith('자율')) {
                cell.append('자율');
            } else if (lesson.subject.startsWith('동아리/행사')) {
                cell.append('동아리');
            } else if (nameMapping.has(lesson.subject)) {
                cell.append(nameMapping.get(lesson.subject)!);
            } else {
                cell.append(lesson.subject);
            }

            // 담임이 아닌 교사 정보가 있으면 표시
            if (lesson.teacher !== null && lesson.teacher !== '담임') {
                const teacherSpan = document.createElement('span');
                teacherSpan.classList.add('teacher');
                teacherSpan.append(lesson.teacher);
                cell.append(document.createElement('br'), teacherSpan);
            }

            // 하우스가 아닌 수업 교실이 있으면 표시
            if (lesson.room !== null && lesson.room !== '하우스') {
                const roomSpan = document.createElement('span');
                roomSpan.classList.add('room');
                roomSpan.append(lesson.room);
                cell.append(document.createElement('br'), roomSpan);
            }

            cell.dataset.subject = lesson.subject;
            cell.style.backgroundColor = defaultColors(lesson.subject);
        }
    }

    const bottomContainer = document.createElement('div');
    bottomContainer.id = 'bottom-container';
    mainContainer.append(bottomContainer);

    const downloadAsImageButton = document.createElement('button');
    downloadAsImageButton.classList.add('button', 'is-primary');
    downloadAsImageButton.id = 'download-as-image';
    downloadAsImageButton.append('이미지로 다운로드');
    downloadAsImageButton.addEventListener('click', async () => {
        downloadAsImageButton.disabled = true;
        table.style.width = '720px';
        table.style.height = '851px';
        const canvas = await html2canvas(table, {
            width: 720,
            height: 850,
            windowWidth: 600,
            windowHeight: 900
        });
        table.style.width = null;
        table.style.height = null;
        const anchor = document.createElement('a');
        anchor.href = canvas.toDataURL();
        anchor.download = '시간표.png';
        document.body.append(anchor);
        anchor.click();
        document.body.removeChild(anchor);
        downloadAsImageButton.disabled = false;
    });
    bottomContainer.append(downloadAsImageButton);
    
    const kjColorsSwitch = document.createElement('input');
    kjColorsSwitch.type = 'checkbox';
    kjColorsSwitch.classList.add('switch', 'is-rounded');
    kjColorsSwitch.id = 'kj-colors-switch';
    kjColorsSwitch.name = 'kj-colors-switch';
    bottomContainer.append(kjColorsSwitch);

    const kjColorsLabel = document.createElement('label');
    kjColorsLabel.id = 'kj-colors-label';
    kjColorsLabel.htmlFor = 'kj-colors-switch';
    kjColorsLabel.append('알록달록 모드');
    bottomContainer.append(kjColorsLabel);

    kjColorsSwitch.addEventListener('change', () => {
        if (kjColorsSwitch.checked) {
            (<Array<HTMLTableCellElement>>Array.from(document.getElementsByClassName('timetable-cell'))).forEach(cell => {
                cell.style.backgroundColor = kjColors(cell.dataset.subject!);
            });
            table.classList.add('kj-color');
        } else {
            (<Array<HTMLTableCellElement>>Array.from(document.getElementsByClassName('timetable-cell'))).forEach(cell => {
                cell.style.backgroundColor = defaultColors(cell.dataset.subject!);
            });
            table.classList.remove('kj-color');
        }
    });
}
