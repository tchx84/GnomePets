/* exported MovingWidgetsContainer */

const {GObject, Gtk, GLib} = imports.gi;

const MOVEMENT_TICK = 100;

var MovingWidgetsContainer = GObject.registerClass({
    GTypeName: 'MovingWidgetsContainer',
    Signals: {
        stopped: {
            param_types: [Gtk.Widget],
            flags: GObject.SignalFlags.RUN_FIRST | GObject.SignalFlags.DETAILED,
        },
        moving: {
            param_types: [Gtk.Widget, GObject.TYPE_INT, GObject.TYPE_INT],
            flags: GObject.SignalFlags.RUN_FIRST | GObject.SignalFlags.DETAILED,
        },
    },
}, class MovingWidgetsContainer extends Gtk.Fixed {
    _init() {
        super._init({});
        this._widgets = {};
        this._targets = {};
        this._positions = {};
        this._movementTickID = GLib.timeout_add(
            GLib.PRIORITY_DEFAULT,
            MOVEMENT_TICK,
            this._updatePositions.bind(this));
        this.connect('destroy', this._onDestroy.bind(this));
    }

    _onDestroy() {
        if (this._movementTickID !== -1)
            GLib.Source.remove(this._movementTickID);
    }

    _updatePositions() {
        Object.entries(this._targets).forEach(([widget, target]) => {
            const deltaX = target.x - this._positions[widget].x;
            const deltaY = target.y - this._positions[widget].y;

            const speedX = Math.min(target.speed, Math.abs(deltaX));
            const speedY = Math.min(target.speed, Math.abs(deltaY));

            const vectorX = Math.sign(deltaX);
            const vectorY = Math.sign(deltaY);

            const x = this._positions[widget].x + vectorX * speedX;
            const y = this._positions[widget].y + vectorY * speedY;

            this.move(this._widgets[widget], x, y);

            if (x === target.x && y === target.y) {
                delete this._targets[widget];
                this.emit(`stopped::${widget}`, this._widgets[widget]);
            } else {
                this.emit(`moving::${widget}`, this._widgets[widget], vectorX, vectorY);
            }

            this._positions[widget].x = x;
            this._positions[widget].y = y;
        });
        return true;
    }

    isMoving(widget) {
        return widget in this._targets;
    }

    getPositionFor(widget) {
        return [this._positions[widget].x, this._positions[widget].y];
    }

    putToPosition(widget, x, y) {
        this.put(widget, x, y);
        this._widgets[widget] = widget;
        this._positions[widget] = {
            x: x,
            y: y,
        };
    }

    moveToTarget(widget, x, y, speed) {
        if (this.get_children().indexOf(widget) === -1)
            return;
        this._targets[widget] = {
            x: x,
            y: y,
            speed: speed,
        };
    }
});
