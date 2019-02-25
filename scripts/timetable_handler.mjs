/**
 * 시간표 관련 정보를 읽어 오는 등 UI와 직접적으로 연관이 없는 일을 하는 모듈.
 * '물리ⅠA'에서, '물리Ⅰ'을 과목(명), 'A'를 반 식별자라고 명명합니다.
 * @module timetable_handler
 */

 /**
  * 수업 한 시간의 정보를 나타내는 클래스.
  */
export class Lesson {
    /*
    subject;
    classIdentifier;
    teacher;
    room;
    */
   
    /**
     * 
     * @param {string} subjectWithClassIdentifier 반 식별자가 있는 과목명. 반 식별자가 없는 경우에는 그냥 과목명. 예) '물리Ⅱ', '경제A'.
     * @param {string | null} teacher 교사명. 담임 등 따로 표시할 필요가 없는 경우에는 null.
     * @param {string | null} room 수업 교실. 하우스 교실 등 따로 표시할 필요가 없는 경우에는 null.
     * @param {boolean | undefined} empty 공강 여부. true이면 공강이며 undefined이면 false로 취급. 
     */
    constructor(subjectWithClassIdentifier, teacher, room, empty) {
        // empty를 설정하지 않으면 기본값 false
        if (empty === undefined) {
            empty = false;
        }

        // empty가 true면 공강이므로 그에 맞게 설정
        if (empty) {
            this.subject = '공강';
            this.classIdentifier = null;
            this.teacher = null;
            this.room = null;
            return;
        }

        // 과목명이 자율이면 그에 맞게 설정
        if (subjectWithClassIdentifier === '자율') {
            this.subject = '자율';
            this.classIdentifier = null;
            this.teacher = null;
            this.room = null;
            return;
        }

        // 과목명에서 마지막 글자가 A~H 중 하나이면 마지막 글자는 반 식별자임
        // 아니면 반 식별자는 없음
        if (/^[A-H]$/.test(subjectWithClassIdentifier.charAt(subjectWithClassIdentifier.length - 1))) {
            this.subject = subjectWithClassIdentifier.substring(0, subjectWithClassIdentifier.length - 1);
            this.classIdentifier = subjectWithClassIdentifier.substring(subjectWithClassIdentifier.length - 1, subjectWithClassIdentifier.length);
        } else {
            this.subject = subjectWithClassIdentifier;
            this.classIdentifier = null;
        }

        // 나머지를 인수로 받은대로 설정
        this.teacher = teacher;
        this.room = room;
    }

    /**
     * 반 식별자가 있는 과목명을 가져옴.
     * @readonly
     * @returns {string} 반 식별자가 있는 과목명. 예) '경제A'.
     */
    get subjectWithClassIdentifier() {
        if (this.classIdentifier != null) {
            return this.subject + this.classIdentifier;
        } else {
            return this.subject;
        }
    }
}

/**
 * resources/timetable${grade}.json 파일을 가져와 해당 학년 해당 수업반의 시간표를 반환함.
 * @param {number} grade 학년. 1학년이면 1이고, 2학년이면 2, 3학년이면 3.
 * @param {number} lectureClass 수업반. 수업 1반이면 1이고, 수업 2반이면 2, 수업 3반이면 3, 수업 8반이면 8.
 * @returns {Array<Array<Array<Lesson>>>} 해당 수업반의 전체 시간표. 배열의 식별자는 0부터 시작함. `timetable[0][0]`은 월요일 1교시에 가능한 수업 목록이고, `timetable[4][5]`는 금요일 6교시에 가능한 수업 목록.
 */
export async function retrieveTimetable(grade, lectureClass) {
    if (typeof grade !== 'number' || !Number.isSafeInteger(grade) || grade < 1 || grade > 3 || typeof lectureClass !== 'number' || !Number.isSafeInteger(lectureClass) || lectureClass < 1 || lectureClass > 8) {
        throw new Error('Invalid grade or lectureClass!');
    }

    const request = new Request(`resources/timetable${grade}.json`);
    const response = await fetch(request);

    const lectureClassJson = (await response.json())[lectureClass - 1];
    return lectureClassJson.map(dayOfWeekJson => dayOfWeekJson.map(periodJson => periodJson.map(lessonJson => new Lesson(lessonJson.subject, lessonJson.teacher, lessonJson.room))));
}

/**
 * resources/optional_subjects.json 파일을 가져와 해당 학년의 선택 과목 목록을 반환함.
 * 선택 과목이란, 같은 수업반이라도 다르게 수강할 수 있는 과목을 의미함. 예를 들어, 수준별 분리 수업의 '영어ⅠA' 등도 선택 과목임.
 * @param grade 학년.
 * @returns {Array<string>} 선택 과목 목록.
 */
export async function retrieveOptionalSubjects(grade) {
    if (typeof grade !== 'number' || !Number.isSafeInteger(grade) || grade < 1 || grade > 3) {
        throw new Error('Invalid grade!');
    }

    const request = new Request(`resources/optional_subjects.json`);
    const response = await fetch(request);

    return (await response.json())[grade - 1];
}

/**
 * resources/subject_name_mapping.json 파일을 가져와 과목명 대응 관계를 반환함.
 * 시간표를 생성해 표시할 때, 과목명이 너무 긴 등의 이유로 다른 이름을 써야 할 경우에 설정함.
 * @returns {Map<string, string>} 과목명 대응 관계.
 */
export async function retrieveSubjectNameMapping() {
    const request = new Request('resources/subject_name_mapping.json');
    const response = await fetch(request);

    return new Map(Object.entries(await response.json()));
}

/**
 * 해당 수업반에서 수강할 수 있는 과목의 목록을 반환.
 * @param {Array<Array<Array<Lesson>>>} timetable 해당 수업반의 전체 시간표.
 * @returns {Array<string>} 과목명의 목록.
 */
export function listSubjects(timetable) {
    const set = new Set();
    timetable.forEach(dayOfWeekTable => dayOfWeekTable.forEach(periodTable => periodTable.forEach(lesson => set.add(lesson.subject))));
    return Array.from(set);
}

/**
 * 해당 수업반에서 수강할 수 있는 해당 과목의 반 식별자 목록을 반환.
 * 예) 수업반 1반에서 '경제A', '경제C'를 수강할 수 있으나 '경제B'는 수강할 수 없는 경우, ['A', 'C']를 반환.
 * @param {Array<Array<Array<Lesson>>>} timetable 해당 수업반의 전체 시간표.
 * @param {string} subject 과목명.
 * @returns {Array<string>} 반 식별자의 목록.
 */
export function listClassIdentifiers(timetable, subject) {
    const set = new Set();
    timetable.forEach(dayOfWeekTable => dayOfWeekTable.forEach(periodTable => periodTable.filter(lesson => lesson.subject === subject).forEach(lesson => set.add(lesson.classIdentifier))));
    return Array.from(set);
}

/**
 * 공강을 나타내는 객체.
 * subject는 '공강', classIdentifier, teacher, room은 null임.
 * @type {Lesson}
 */
export const BLANK_LESSON = new Lesson(null, null, null, true);
