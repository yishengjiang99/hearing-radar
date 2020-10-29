let ctx;
export const getCtx = () => {
	if (!window) {
		return null; 
	}
	if (!ctx) {
		ctx = new AudioContext(); 
	}
	return ctx;
};
