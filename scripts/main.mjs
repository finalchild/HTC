import {listClassIdentifiers, listSubjects, retrieveOptionalSubjects, retrieveTimetable} from './timetable_handler.mjs';

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
        checkbox.classList.add('is-checkradio', 'is-medium');
        checkbox.setAttribute('type', 'checkbox');
        checkbox.setAttribute('id', `checkbox-${subject.replace(' ', '-')}`);
        checkbox.setAttribute('name', `checkbox-${subject.replace(' ', '-')}`);
        checkboxDiv.append(checkbox);

        const label = document.createElement('label');
        label.setAttribute('for', `checkbox-${subject.replace(' ', '-')}`);
        label.append(subject);
        checkboxDiv.append(label);

        const classIdentifiers = listClassIdentifiers(timetable, subject);
        if (classIdentifiers.size > 1) {
            const selectDiv = document.createElement('div');
            selectDiv.classList.add('select', 'is-primary');
            selectDiv.setAttribute('id', `select-${subject.replace(' ', '-')}`);
            const select = document.createElement('select');
            for (let classIdentifier of Array.from(classIdentifiers).sort()) {
                const option = document.createElement('option');
                option.append(classIdentifier + '반');
                select.append(option);
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
    button.setAttribute('id', 'submit-main-form');
    button.append('선택 완료');
    button.addEventListener('click', onSubmitMainForm);
    box.append(button);

    mainContainer.append(box);
}

async function onSubmitMainForm() {

}

