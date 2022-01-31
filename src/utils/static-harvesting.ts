import { HarvestTicket } from '../tickets/harvest';

export class HarvestingSite {
    creep: Creep | undefined;
    container: StructureContainer | undefined;
    private _distance: number | null;

    constructor(public ticket: HarvestTicket) {
        if (ticket.assignees[0]) {
            this.creep = Game.creeps[ticket.assignees[0]];
        }

        if (ticket.container) {
            let container = Game.getObjectById(ticket.container) as StructureContainer | null;
            if (container) {
                this.container = container;
            }
        }

        this._distance = null;
    }

    distance(creep: Creep): number | null {
        let distance = null;
        if (this.container) {
            distance = creep.pos.findPathTo(this.container).length;
        } else if (this.creep) {
            distance = creep.pos.findPathTo(this.creep).length;
        }

        this._distance = distance;
        return distance;
    }

    reservationAvailable(request_amount: number): boolean {
        let reserved = 0;
        for (const creep in this.ticket.reserved) {
            reserved += this.ticket.reserved[creep];
        }

        let available = 0;
        if (this.container) {
            available = this.container.store.getUsedCapacity() - reserved;
        } else if (this.creep) {
            available = this.creep.store.getUsedCapacity() - reserved;
        } else {
            return false;
        }

        return available >= request_amount;
    }

    reserve(creep: Creep): void {
        this.ticket.reserved[creep.name] = creep.store.getFreeCapacity();
    }
}
