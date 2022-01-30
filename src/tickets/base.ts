type RoomName = string;

export interface Ticket {
    pid: number,
    requestor: RoomName | 'system',
    type: string, // default ticket type
    maxAssignees: number, // max amount of creeps who can pick up this job
    assignees: string[],
    requirements: BodyPartConstant[] // body parts required for the ticket
    priority: number;
}
