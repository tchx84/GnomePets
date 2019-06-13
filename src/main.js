/* exported main */
/* global pkg */

pkg.initGettext();
pkg.initFormat();
pkg.require({
    Gio: '2.0',
    Gtk: '3.0',
});

const {Gio, Gdk, Gtk} = imports.gi;

const {DefaultPetWidget} = imports.defaultPetWidget;
const {MovingWidgetsContainer} = imports.movingWidgetsContainer;
const {PetsWindow} = imports.window;

function main(argv) {
    const application = new Gtk.Application({
        application_id: 'org.gnome.Pets',
        flags: Gio.ApplicationFlags.FLAGS_NONE,
    });

    application.connect('activate', app => {
        let {activeWindow} = app;

        if (!activeWindow) {
            const widget = new DefaultPetWidget();
            widget.visible = true;

            const container = new MovingWidgetsContainer({});
            container.putToPosition(widget, 0, 0);
            container.visible = true;

            const events = new Gtk.EventBox();
            events.add_events(Gdk.EventMask.POINTER_MOTION_MASK);
            events.add(container);
            events.visible = true;

            activeWindow = new PetsWindow(app);
            activeWindow.add(events);
        }

        activeWindow.present();
    });

    return application.run(argv);
}
