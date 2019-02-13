export class Lesson {
    /*
    subject;
    classIdentifier;
    teacher;
    room;
    */
   
    constructor(subjectWithClassIdentifier, teacher, room, empty) {
        if (empty === undefined) {
            empty = false;
        }
        if (empty) {
            this.subject = '공강';
            this.classIdentifier = null;
            this.teacher = null;
            this.room = null;
            return;
        }
        if (subjectWithClassIdentifier === '자율') {
            this.subject = '자율';
            this.classIdentifier = null;
            this.teacher = null;
            this.room = null;
            return;
        }

        if (/^[A-H]$/.test(subjectWithClassIdentifier.charAt(subjectWithClassIdentifier.length - 1))) {
            this.subject = subjectWithClassIdentifier.substring(0, subjectWithClassIdentifier.length - 1);
            this.classIdentifier = subjectWithClassIdentifier.substring(subjectWithClassIdentifier.length - 1, subjectWithClassIdentifier.length);
        } else {
            this.subject = subjectWithClassIdentifier;
            this.classIdentifier = null;
        }
        this.teacher = teacher;
        this.room = room;
    }

    get subjectWithClassIdentifier() {
        if (this.classIdentifier != null) {
            return this.subject + this.classIdentifier;
        } else {
            return this.subject;
        }
    }
}

export async function retrieveTimetable(grade, lectureClass) {
    if (typeof grade !== 'number' || !Number.isSafeInteger(grade) || grade < 1 || grade > 3 || typeof lectureClass !== 'number' || !Number.isSafeInteger(lectureClass) || lectureClass < 1 || lectureClass > 8) {
        throw 'Invalid grade or lectureClass!';
    }

    const request = new Request(`resources/timetable${grade}.json`);
    const response = await fetch(request);

    const lectureClassJson = (await response.json())[lectureClass - 1];
    return lectureClassJson.map(dayOfWeekJson => dayOfWeekJson.map(periodJson => periodJson.map(lessonJson => new Lesson(lessonJson.subject, lessonJson.teacher, lessonJson.room))));
}

export async function retrieveOptionalSubjects(grade) {
    if (typeof grade !== 'number' || !Number.isSafeInteger(grade) || grade < 1 || grade > 3) {
        throw 'Invalid grade!';
    }

    const request = new Request(`resources/optional_subjects.json`);
    const response = await fetch(request);

    return (await response.json())[grade - 1];
}

export async function retrieveSubjectNameMapping() {
    const request = new Request('resources/subject_name_mapping.json');
    const response = await fetch(request);

    return new Map(Object.entries(await response.json()));
}

export function listSubjects(timetable) {
    const set = new Set();
    timetable.forEach(dayOfWeekTable => dayOfWeekTable.forEach(periodTable => periodTable.forEach(lesson => set.add(lesson.subject))));
    return Array.from(set);
}

export function listClassIdentifiers(timetable, subject) {
    const set = new Set();
    timetable.forEach(dayOfWeekTable => dayOfWeekTable.forEach(periodTable => periodTable.filter(lesson => lesson.subject === subject).forEach(lesson => set.add(lesson.classIdentifier))));
    return Array.from(set);
}

export const BLANK_LESSON = new Lesson(null, null, null, true);
