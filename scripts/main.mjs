import {listClassIdentifiers, listSubjects, retrieveOptionalSubjects, retrieveTimetable, BLANK_LESSON} from './timetable_handler.mjs';

const selectGrade = document.getElementById('select-grade');
const selectLectureClass = document.getElementById('select-lecture-class');
const submitClass = document.getElementById('submit-class');
const mainContainer = document.getElementById('main-container');

let grade;
let lectureClass;

let timetable;
let optionalSubjects;

let optionalSubjectsToChoose;

async function onSubmitClass() {
    selectGrade.disabled = true;
    selectLectureClass.disabled = true;
    submitClass.disabled = true;

    grade = parseInt(selectGrade.options[selectGrade.selectedIndex].value);
    lectureClass = parseInt(selectLectureClass.options[selectLectureClass.selectedIndex].value);

    const timetableP = retrieveTimetable(grade, lectureClass);
    const optionalSubjectsP = retrieveOptionalSubjects(grade);
    timetable = await timetableP;
    optionalSubjects = await optionalSubjectsP;

    const subjects = listSubjects(timetable);
    optionalSubjects = optionalSubjects.filter(subject => subjects.has(subject));

    await createMainForm();
}

submitClass.addEventListener('click', onSubmitClass);

async function createMainForm() {
    const box = document.createElement('div');
    box.classList.add('box');
    const field = document.createElement('div');
    field.classList.add('field');
    for (let subject of optionalSubjects) {
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
            for (let classIdentifier of classIdentifiers.sort()) {
                const option = document.createElement('option');
                option.value = classIdentifier;
                option.text = `${classIdentifier}반`;
                select.add(option);
            }
            selectDiv.append(select);
            checkboxDiv.append(selectDiv);

            selectDiv.style.display = 'none';
            checkbox.addEventListener('change', e => {
                if (checkbox.checked) {
                    selectDiv.style.display = 'inline-block';
                } else {
                    selectDiv.style.display = 'none';
                }
            });
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
        tr.append(th0);
        const th1 = document.createElement('th');
        th1.append('월');
        tr.append(th1);
        const th2 = document.createElement('th');
        th2.append('화');
        tr.append(th2);
        const th3 = document.createElement('th');
        th3.append('수');
        tr.append(th3);
        const th4 = document.createElement('th');
        th4.append('목');
        tr.append(th4);
        const th5 = document.createElement('th');
        th5.append('금');
        tr.append(th5);
        thead.append(tr);
    }
    {
        for (let period = 0; period < 6; period++) {
            const row = table.insertRow();
            const th = document.createElement('th');
            th.append(period + 1);
            row.append(th);
            for (let dayOfWeek = 0; dayOfWeek < 5; dayOfWeek++) {
                const lessons = timetable[dayOfWeek][period];
                let lesson;
                if (lessons.length === 1 && !optionalSubjects.includes(lessons[0])) {
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
                        console.log('could not make a timetable from the selections');
                        console.log(filteredLessons);
                        return;
                    }
                }

                const cell = row.insertCell();
                cell.append(lesson.subject);
                if (lesson.teacher) {
                    const teacherSpan = document.createElement('span');
                    teacherSpan.classList.add('teacher');
                    teacherSpan.append(lesson.teacher);
                    cell.append(document.createElement('br'), teacherSpan);
                }
                if (lesson.room) {
                    const roomSpan = document.createElement('span');
                    roomSpan.classList.add('room');
                    roomSpan.append(lesson.room);
                    cell.append(document.createElement('br'), roomSpan);
                }
                `<td {{#if empty}}style="background-color: #9197b5;"{{/if}}>{{subject}}{{#if teacher}}<br><span class="teacher">{{teacher}}</span>{{/if}}{{#if room}}<br><span class="room">{{room}}</span>{{/if}}</td>`
            }
        }
    }
    mainContainer.append(table);
}
