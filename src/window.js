/* exported PetsWindow */

const {GObject, Gtk, Gdk} = imports.gi;

var PetsWindow = GObject.registerClass({
    GTypeName: 'PetsWindow',
}, class PetsWindow extends Gtk.ApplicationWindow {
    _init(application) {
        super._init({application});

        this.decorated = false;
        this.modal = true;
        this.set_keep_above(true);
        this.set_type_hint(Gdk.WindowTypeHint.NOTIFICATION);
        this.set_urgency_hint(true);
        this.maximize();

        const screen = this.get_screen();
        this.set_visual(screen.get_rgba_visual());

        const provider = new Gtk.CssProvider();
        provider.load_from_resource('/org/gnome/Pets/window.css');
        Gtk.StyleContext.add_provider_for_screen(Gdk.Screen.get_default(),
            provider, Gtk.STYLE_PROVIDER_PRIORITY_APPLICATION);
    }
});
