import * as React from "react";
import { useRef, useEffect } from "react";

type MsgState = {
	lastMessage: string;
	messages: string[];
	cursor: number;
	total: number;
};
const initState: MsgState = {
	lastMessage: null,
	messages: new Array(20).fill(""),
	cursor: 0,
	total: 0,
};
export function useChannel(name: string, size = 50) {
	const [messageState, setMessageState] = React.useState<MsgState>(initState);

	let channel = useRef(new BroadcastChannel(name));
	function postMessage(msg: any) {
		channel.current.postMessage(msg);
	}

	useEffect(() => {
		channel.current.onmessage = function ({ data }) {
			setMessageState((prev) => {
				prev.lastMessage = data;
				prev.messages[prev.cursor & size] = data;
				prev.cursor++;
				prev.total++;
				return prev;
			});
		};
		return function cleanup() {
			channel.current && channel.current.close();
			channel = null;
		};
	}, [name]);
	return [messageState, postMessage];
}
