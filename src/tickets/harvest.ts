import { Logger } from "utils/logger";
import { System } from "../system";
import { Ticket } from "./base";

export interface HarvestTicket extends Ticket {
    type: 'harvester',
    source: string,
    container?: string,
    reserved: {
        [key: string]: number
    },
}

export class HarvestTicketHelper {
    static create(room: Room, maxAssignees: number, source: string, container?: string): HarvestTicket {
        let ticket: HarvestTicket = {
            assignees: [],
            maxAssignees: maxAssignees,
            pid: System.getPid(),
            requestor: room.name,
            requirements: [WORK, CARRY, MOVE],
            source: source,
            container: container,
            type: 'harvester',
            reserved: {},
        }

        room.memory.tickets.push(ticket);
        return ticket;
    }

    static run(creep: Creep, room: Room, ticket: HarvestTicket) {
        let source = Game.getObjectById(ticket.source) as Source;

        if (creep.store.getFreeCapacity() == 0) {
            if (ticket.container) {
                const container =  Game.getObjectById(ticket.container) as StructureContainer;
                if (container) {
                    creep.transfer(container, RESOURCE_ENERGY, creep.store.getUsedCapacity());
                } else {
                    Logger.error(`No container present for harvester(${creep.id}) with ticket(${ticket.pid})`, 'HarvestTicketHelper');
                }
            }
        }

        if (creep.harvest(source) == ERR_NOT_IN_RANGE) {
            creep.moveTo(source);
        }
    }
}
