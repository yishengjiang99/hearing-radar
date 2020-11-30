export const Playlist = ({ list, title }) => {
	return (
		<div>
			<div>
				<h3>{title}</h3>
				{list.map((l) => (
					<li>{l}</li>
				))}
			</div>
		</div>
	);
};
