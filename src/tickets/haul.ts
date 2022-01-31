import { System } from "../system";
import { Ticket } from "./base";
import { HarvestTicket } from "./harvest";

export type Container = StructureContainer | StructureStorage | StructureSpawn | StructureExtension | StructureTower;

export interface HaulerTicket extends Ticket {
    type: 'hauler',
    target: string,
}

export class HaulerTicketHelper {
    static create(room: Room, target: string, maxAssignees: number): HaulerTicket {
        let ticket: HaulerTicket = {
            assignees: [],
            maxAssignees: maxAssignees,
            pid: System.getPid(),
            requestor: room.name,
            requirements: [WORK, CARRY, MOVE],
            target: target,
            type: 'hauler'
        }
        room.memory.tickets.push(ticket);
        return ticket;
    }

    static run(ticket: HaulerTicket, creep: Creep) {
        const source = creep.room.find(FIND_SOURCES_ACTIVE)[0];

        if (creep.memory.work == null && creep.store.getUsedCapacity() > 0) {
            creep.memory.work = 'dropping';
        } else if (creep.memory.work == null) {
            creep.memory.work = 'collecting';
        }

        // check if creep has to switch task
        if (creep.memory.work == 'collecting' && creep.store.getFreeCapacity() == 0) {
            creep.memory.work = 'dropping';
        } else if (creep.memory.work == 'dropping' && creep.store.getUsedCapacity() == 0) {
            creep.memory.work = 'collecting';
        }

        // do task
        if (creep.memory.work == 'collecting') {
            let to_pickup = creep.store.getFreeCapacity();
            let harvesting_tickets = creep.room.memory.tickets.filter(t => t.type == 'harvester') as Array<HarvestTicket>;
            let source = harvesting_tickets.map(ticket => {

                // lots of distance calculation
                if (ticket.container == null) {
                    let assigned_creep = ticket.assignees[0];
                    if (assigned_creep) {
                        return {
                            ticket,
                            distance: creep.pos.findPathTo(Game.creeps[assigned_creep]).length,
                            target: assigned_creep,
                        };
                    } else {
                        return {
                            ticket,
                            distance: null,
                            target: null,
                        };
                    }
                } else {
                    let container = Game.getObjectById(ticket.container) as StructureContainer | null;
                    if (container) {
                        return {
                            ticket,
                            distance: creep.pos.findPathTo(container).length,
                            target: container,
                        };
                    } else {
                        return {
                            ticket,
                            distance: null,
                            target: null,
                        };
                    }
                }
            })
                .filter(s => s.distance != null && s.target != null)
                .sort((a, b) => a.distance! - b.distance!)
                .shift();

            if (source) {
                if (typeof(source.target) == 'string') {
                    if (Game.creeps[source.target].transfer(creep, RESOURCE_ENERGY) == ERR_NOT_IN_RANGE) {
                        creep.moveTo(Game.creeps[source.target]);
                    }
                } else {
                    if (creep.withdraw(source.target as StructureContainer, RESOURCE_ENERGY) == ERR_NOT_IN_RANGE) {
                        creep.moveTo(source.target as StructureContainer);
                    }
                }
            }
        } else if (creep.memory.work == 'dropping') {
            const target = Game.getObjectById(ticket.target) as Container;

            const code = creep.transfer(target, RESOURCE_ENERGY);
            if(code == ERR_NOT_IN_RANGE) {
                creep.moveTo(target);
            } else if (code == ERR_FULL) {
                creep.room.memory.tickets.splice(creep.room.memory.tickets.indexOf(ticket), 1);
                creep.memory.ticket = undefined;
                creep.memory.work = undefined;
                // TODO: also unnasign other creeps from task
            }
        }
    }
}
