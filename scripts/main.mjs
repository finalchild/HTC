import {listClassIdentifiers, listSubjects, retrieveOptionalSubjects, retrieveSubjectNameMapping, retrieveTimetable, BLANK_LESSON} from './timetable_handler.mjs';

const selectGrade = document.getElementById('select-grade');
const selectLectureClass = document.getElementById('select-lecture-class');
const submitClass = document.getElementById('submit-class');
const mainContainer = document.getElementById('main-container');

let grade;
let lectureClass;

let timetable;
let optionalSubjects;
let nameMapping;

async function onSubmitClass() {
    selectGrade.disabled = true;
    selectLectureClass.disabled = true;
    submitClass.disabled = true;

    grade = parseInt(selectGrade.options[selectGrade.selectedIndex].value);
    lectureClass = parseInt(selectLectureClass.options[selectLectureClass.selectedIndex].value);

    const timetableP = retrieveTimetable(grade, lectureClass);
    const optionalSubjectsP = retrieveOptionalSubjects(grade);
    const nameMappingP = retrieveSubjectNameMapping();
    timetable = await timetableP;
    optionalSubjects = await optionalSubjectsP;
    nameMapping = await nameMappingP;

    const subjects = listSubjects(timetable);
    optionalSubjects = optionalSubjects.filter(subject => subjects.includes(subject) || subject === '---');
    for (let i = 0; i < optionalSubjects.length; i++) {
        while ((i === 0 || optionalSubjects[i - 1] === '---') && optionalSubjects[i] === '---') {
            optionalSubjects.splice(i, 1);
        }
    }
    if (optionalSubjects.length !== 0 && optionalSubjects[optionalSubjects.length - 1] === '---') {
        optionalSubjects.pop();
    }

    await createMainForm();
}

submitClass.addEventListener('click', onSubmitClass);

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

        const checkboxDiv = document.createElement('div');
        checkboxDiv.classList.add('checkbox-div');

        const checkbox = document.createElement('input');
        checkbox.classList.add('is-checkradio', 'is-medium', 'checkbox-subject');
        checkbox.type = 'checkbox';
        checkbox.id = `checkbox-${subject.replace(' ', '-')}`;
        checkbox.name = `checkbox-${subject.replace(' ', '-')}`;
        checkbox.value = subject;
        checkboxDiv.append(checkbox);

        const label = document.createElement('label');
        label.classList.add('checkbox-label');
        label.htmlFor = `checkbox-${subject.replace(' ', '-')}`;
        label.append(subject);
        checkboxDiv.append(label);

        const classIdentifiers = listClassIdentifiers(timetable, subject);
        if (classIdentifiers.length > 1) {
            const selectDiv = document.createElement('div');
            selectDiv.classList.add('select', 'is-primary');
            const select = document.createElement('select');
            select.classList.add('select-subject');
            select.id = `select-${subject.replace(' ', '-')}`;
            for (const classIdentifier of classIdentifiers.sort()) {
                const option = document.createElement('option');
                option.value = classIdentifier;
                option.text = `${classIdentifier}반`;
                select.add(option);
            }
            selectDiv.append(select);
            checkboxDiv.append(selectDiv);

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
                    classTimeInfo.innerHTML = '';
                    for (let dayOfWeek = 0; dayOfWeek < 5; dayOfWeek++) {
                        for (let period = 0; period < 6; period++) {
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
                } else {
                    selectDiv.style.display = 'none';
                    classTimeInfo.style.display = 'none';
                }
            });
            select.addEventListener('change', e => {
                classTimeInfo.innerHTML = '';
                for (let dayOfWeek = 0; dayOfWeek < 5; dayOfWeek++) {
                    for (let period = 0; period < 6; period++) {
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
            });

            // 수학과 영어 분반 수업을 따로 처리
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

    const button = document.createElement('button');
    button.classList.add('button', 'is-primary');
    button.id = 'submit-main-form';
    button.append('선택 완료');
    button.addEventListener('click', onSubmitMainForm);
    box.append(button);

    mainContainer.append(box);
}

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
            const select = document.getElementById(`select-${subject.replace(' ', '-')}`);
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
                            notification.classList.add('notification', 'is-danger');
                            notification.id = 'error-notification';
                            const deleteButton = document.createElement('button');
                            deleteButton.classList.add('delete');
                            deleteButton.addEventListener('click', e => {
                                notification.removeChild(deleteButton);
                            });
                            notification.append(deleteButton);
                            notification.append('시간 충돌이 있습니다!\n' + filteredLessons);
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
                if (lesson.teacher && lesson.teacher !== '담임') {
                    const teacherSpan = document.createElement('span');
                    teacherSpan.classList.add('teacher');
                    teacherSpan.append(lesson.teacher);
                    cell.append(document.createElement('br'), teacherSpan);
                }
                if (lesson.room && lesson.room !== '하우스') {
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
