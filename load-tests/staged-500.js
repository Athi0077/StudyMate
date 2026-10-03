import { studentBehavior, teacherBehavior, principalBehavior } from './test.js';

export const options = {
  thresholds: {
    'http_req_duration': [{ threshold: 'p(95)<3000', abortOnFail: true }], 
    'http_req_failed': [{ threshold: 'rate<0.05', abortOnFail: true }],
  },
  scenarios: {
    student_traffic: {
      executor: 'ramping-vus',
      startVUs: 0,
      stages: [
        { duration: '5s', target: 400 }, // 80% of 500
        { duration: '30s', target: 400 },
        { duration: '5s', target: 0 },
      ],
      exec: 'studentTraffic',
    },
    teacher_traffic: {
      executor: 'ramping-vus',
      startVUs: 0,
      stages: [
        { duration: '5s', target: 90 },  // 18% of 500
        { duration: '30s', target: 90 },
        { duration: '5s', target: 0 },
      ],
      exec: 'teacherTraffic',
    },
    principal_traffic: {
      executor: 'ramping-vus',
      startVUs: 0,
      stages: [
        { duration: '5s', target: 10 },   // 2% of 500
        { duration: '30s', target: 10 },
        { duration: '5s', target: 0 },
      ],
      exec: 'principalTraffic',
    }
  }
};

export function studentTraffic() { studentBehavior(); }
export function teacherTraffic() { teacherBehavior(); }
export function principalTraffic() { principalBehavior(); }
