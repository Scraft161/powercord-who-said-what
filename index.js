// port of who-said-what vizality plugin with base of better message deletion goosemod plugin

// direct port of who-said-what for testing purposes
const { Plugin } = require("powercord/entities");
const { getModule } = require ("powercord/webpack");

const mod = getModule((module) => module["register"] !== undefined);
let interval;
let index = 0;
let original;
let style;

module.exports = class PCWhoSaidWhat extends Plugin {
	startPlugin() {
		let deleted = [];

		const styleMessage = async ({ id }) => {
			let el = document.getElementById(`chat-messages-${id}`);
			if (!el) return;

			if (el.classList.contains("pc-deleted-message")) return;

			el.classList.add("pc-deleted-message");
		};

		const run = () => {
			for (let obj of deleted) {
				styleMessage(obj);
			}
		};

		const getWantedHandler = (mod) =>
			mod._orderedActionHandlers.MESSAGE_DELETE.find((x) =>
				x.actionHandler.toString().includes("revealedMessageId")
			);

		const setup = () => {
			try {
				original = getWantedHandler(mod);
			} catch (e) {
				return setTimeout(setup, 3000);
			}

			index = mod._orderedActionHandlers.MESSAGE_DELETE.indexOf(
				getWantedHandler(mod)
			);

			const originalActionHandler =
				mod._orderedActionHandlers.MESSAGE_DELETE[index].actionHandler;
			const originalstoreDidChange =
				mod._orderedActionHandlers.MESSAGE_DELETE[index].storeDidChange;

			mod._orderedActionHandlers.MESSAGE_DELETE[index] = {
				actionHandler: (obj) => {
					if (
						document
							.getElementById(`chat-messages-${obj.id}`)
							?.className.includes("ephemeral")
					)
						return originalActionHandler(obj);

					if (deleted.find((x) => x.id === obj.id)) return;

					deleted.push(obj);

					styleMessage(obj);
				},

				storeDidChange: (obj) => {
					if (
						document
							.getElementById(`chat-messages-${obj.id}`)
							?.className.includes("ephemeral")
					)
						return originalstoreDidChange(obj);
				},
			};
		};

		interval = setInterval(run, 300);

		setup();

		this.style.backgroundColor = '#f047471a'
	}

	pluginWillUnload() {
		clearInterval(interval);

		for (let e of document.getElementsByClassName("pc-deleted-message")) {
			e.remove();
		}

		mod._orderedActionHandlers.MESSAGE_DELETE[index] = original;
	}
}
