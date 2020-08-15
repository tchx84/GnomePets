/* exported AnimatedWidget */

const {GObject, Gtk, Gio, GdkPixbuf, GLib} = imports.gi;
const ByteArray = imports.byteArray;

var AnimatedWidget = GObject.registerClass({
    GTypeName: 'AnimatedWidget',
}, class AnimatedWidget extends Gtk.Image {
    _init(props) {
        super._init(props);
        this._animations = {};
        this._currentAnimation = '';
        this._currentFrame = -1;
        this._frameTickID = -1;
    }

    _updateFrame() {
        const {frames} = this._animations[this._currentAnimation];
        this._currentFrame = (this._currentFrame + 1) % frames.length;
        this.set_from_pixbuf(frames[this._currentFrame]);
        return true;
    }

    loadAnimations(uri) {
        const file = Gio.File.new_for_uri(uri);
        const [, content] = file.load_contents(null);
        const description = JSON.parse(ByteArray.toString(content));
        const imagesCache = {};

        Object.entries(description.animations).forEach(([animation, data]) => {
            this._animations[animation] = {
                timeBetweenFrames: data.timeBetweenFrames,
                frames: [],
            };

            data.frames.forEach(frame => {
                const {resource} = frame;
                let image = null;

                if (resource in imagesCache) {
                    image = imagesCache[resource];
                } else {
                    image = GdkPixbuf.Pixbuf.new_from_resource(resource);
                    imagesCache[resource] = image;
                }

                const subImage = image.new_subpixbuf(
                    frame.x,
                    frame.y,
                    frame.width,
                    frame.height);
                this._animations[animation].frames.push(subImage);
            });
        });
    }

    set animation(animation) {
        if (animation === this._currentAnimation)
            return;

        if (!(animation in this._animations))
            return;

        if (this._frameTickID !== -1) {
            GLib.Source.remove(this._frameTickID);
            this._frameTickID = -1;
        }

        this._currentAnimation = animation;
        this._currentFrame = -1;
        this._updateFrame();

        const tick = this._animations[animation].timeBetweenFrames;
        if (tick <= 0)
            return;

        this._frameTickID = GLib.timeout_add(
            GLib.PRIORITY_DEFAULT,
            tick,
            this._updateFrame.bind(this));
    }

    get animation() {
        return this._currentAnimation;
    }
});
