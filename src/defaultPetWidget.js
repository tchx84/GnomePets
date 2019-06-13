/* exported DefaultPetWidget */

const {GObject, GLib} = imports.gi;
const {AnimatedWidget} = imports.animatedWidget;

const TICK = 1000;
const SLEEP_TIME = 30000;
const RANDOM_TICK_DEFAULT = 1000;
const RANDOM_TICK_CALL = 3000;
const RANDOM_TICK_IDLE = 5000;

var DefaultPetWidget = GObject.registerClass({
    GTypeName: 'DefaultPetWidget',
}, class Manager extends AnimatedWidget {
    _init(props = {}) {
        super._init(props);

        this._lastActionTime = null;
        this._isBusy = false;
        this._timeTickID = -1;
        this._randomTickID = -1;
        this._stoppedID = -1;
        this._movingID = -1;
        this._clickID = -1;
        this._hoverID = -1;

        this.connect('realize', this.onStart.bind(this));
        this.connect('destroy', this.onFinish.bind(this));
    }

    _setRandomTickTo(tick) {
        if (this._randomTickID !== -1)
            GLib.Source.remove(this._randomTickID);
        this._randomTickID = GLib.timeout_add(
            GLib.PRIORITY_DEFAULT,
            tick,
            this.onRandomChance.bind(this));
    }

    _setDoneWithAction() {
        this._lastActionTime = GLib.get_monotonic_time();
        this._isBusy = false;
    }

    _findWidgetSize() {
        const alloc = this.get_allocation();
        return [alloc.width, alloc.height];
    }

    _findRandomPosition() {
        const alloc = this.container.get_allocation();
        const [width, height] = this._findWidgetSize();
        const x = Math.round(Math.random() * (alloc.width - width));
        const y = Math.round(Math.random() * (alloc.height - height));
        return [x, y];
    }

    _findWidgetCenter() {
        const [width, height] = this._findWidgetSize();
        const [x, y] = this.container.getPositionFor(this);
        return [x + width / 2, y + height / 2];
    }

    _findHoverDistance() {
        const [, height] = this._findWidgetSize();
        return height * 2;
    }

    onStart() {
        this.loadAnimations(this.resource);
        this.animation = 'default';

        this._movingID = this.container.connect(`moving::${this}`, this.onMoving.bind(this));
        this.stoppedID = this.container.connect(`stopped::${this}`, this.onStopped.bind(this));

        this._clickID = this.events.connect('button-press-event', this.onClick.bind(this));
        this._hoverID = this.events.connect('motion-notify-event', this.onHover.bind(this));

        this._lastActionTime = GLib.get_monotonic_time();
        this._timeTickID = GLib.timeout_add(
            GLib.PRIORITY_DEFAULT,
            TICK,
            this.onTimePassed.bind(this));

        this._setRandomTickTo(RANDOM_TICK_DEFAULT);
    }

    onMoving(container, widget, vectorX, vectorY) {
        if (vectorX === 0 && vectorY === -1)
            this.animation = 'walkNorth';
        else if (vectorX === 1 && vectorY === -1)
            this.animation = 'walkNorthEast';
        else if (vectorX === 1 && vectorY === 0)
            this.animation = 'walkEast';
        else if (vectorX === 1 && vectorY === 1)
            this.animation = 'walkSouthEast';
        else if (vectorX === 0 && vectorY === 1)
            this.animation = 'walkSouth';
        else if (vectorX === -1 && vectorY === 1)
            this.animation = 'walkSouthWest';
        else if (vectorX === -1 && vectorY === 0)
            this.animation = 'walkWest';
        else if (vectorX === -1 && vectorY === -1)
            this.animation = 'walkNorthWest';

        this._isBusy = true;
    }

    onStopped() {
        this.animation = 'default';
        this._setDoneWithAction();
    }

    onClick(events, event) {
        const [, x, y] = event.get_coords();
        const [width, height] = this._findWidgetSize();
        const posX = Math.round(x - width / 2);
        const posY = Math.round(y - height / 2);

        this.container.moveToTarget(this, posX, posY, this.speed);
    }

    onHover(events, event) {
        if (this.container.isMoving(this))
            return;

        const [, x, y] = event.get_coords();
        const [posX, posY] = this._findWidgetCenter();
        const distance = Math.sqrt(Math.pow(x - posX, 2) + Math.pow(y - posY, 2));
        if (distance > this._findHoverDistance()) {
            this._setDoneWithAction();
            return;
        }

        const deltaX = x - posX;
        const deltaY = y - posY;
        const predominantAxis = Math.abs(deltaX) >= Math.abs(deltaY) ? 'x' : 'y';

        if (predominantAxis === 'x') {
            if (Math.sign(deltaX) >= 1)
                this.animation = 'playEast';
            else
                this.animation = 'playWest';
        } else if (Math.sign(deltaY) >= 1) {
            this.animation = 'playSouth';
        } else {
            this.animation = 'playNorth';
        }

        this._isBusy = true;
    }

    onTimePassed() {
        if (this._isBusy)
            return true;

        const currentTime = GLib.get_monotonic_time();
        const elapsedTime = (currentTime - this._lastActionTime) / 1000;

        if (elapsedTime >= SLEEP_TIME) {
            this.animation = 'sleep';
            this._isBusy = true;
        }

        return true;
    }

    onRandomChance() {
        if (this._isBusy)
            return true;

        let tick = RANDOM_TICK_DEFAULT;
        const chance = Math.floor(Math.random() * 100);

        if (chance <= 25) {
            this.animation = 'call';
            tick = RANDOM_TICK_CALL;
        } else if (chance <= 50) {
            this.animation = 'idle';
            tick = RANDOM_TICK_IDLE;
        } else if (chance <= 75) {
            const [posX, posY] = this._findRandomPosition();
            this.container.moveToTarget(this, posX, posY, this.speed);
        } else {
            this.animation = 'default';
        }

        this._setRandomTickTo(tick);
        return false;
    }

    onFinish() {
        if (this._timeTickID !== -1)
            GLib.Source.remove(this._timeTickId);
        if (this._randomTickID !== -1)
            GLib.Source.remove(this._randomTickId);
        if (this._stoppedID !== -1)
            GLib.Source.remove(this._stoppedID);
        if (this._movingID !== -1)
            GLib.Source.remove(this._movingID);
        if (this._clickID !== -1)
            GLib.Source.remove(this._clickID);
        if (this._hoverID !== -1)
            GLib.Source.remove(this._hoverID);
    }

    get speed() {
        void this;
        return 20;
    }

    get resource() {
        void this;
        return 'resource:///org/gnome/Pets/animations.json';
    }

    get events() {
        return this.container.get_parent();
    }

    get container() {
        return this.get_parent();
    }
});
