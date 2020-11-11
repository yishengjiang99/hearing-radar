// import React, { useState } from "react";
// import { makeStyles, useTheme } from "@material-ui/core/styles";
// import Card from "@material-ui/core/Card";
// import CardContent from "@material-ui/core/CardContent";
// import CardMedia from "@material-ui/core/CardMedia";
// import IconButton from "@material-ui/core/IconButton";
// import Typography from "@material-ui/core/Typography";
// import SkipPreviousIcon from "@material-ui/icons/SkipPrevious";
// import PlayArrowIcon from "@material-ui/icons/PlayArrow";
// import Pause from "@material-ui/icons/Pause";

// import SkipNextIcon from "@material-ui/icons/SkipNext";
// export type CardInfo = {
// 	title: string;
// 	subtitle: string;
// 	image: string;
// 	imageTitle: string;
// 	mediaUrl: string;
// 	tileImage: string;
// };
// export type CardProps = {
// 	info: CardInfo;
// 	btnClicked: (mediaUrl: string, cmd: PlayAction) => void;
// };

// const useStyles = makeStyles((theme) => ({
// 	root: {
// 		display: "flex",
// 	},
// 	details: {
// 		display: "flex",
// 		flexDirection: "column",
// 	},
// 	content: {
// 		flex: "1 0 auto",
// 	},
// 	cover: {
// 		width: 151,
// 	},
// 	controls: {
// 		display: "flex",
// 		alignItems: "center",
// 		paddingLeft: theme.spacing(1),
// 		paddingBottom: theme.spacing(1),
// 	},
// 	playIcon: {
// 		height: 38,
// 		width: 38,
// 	},
// }));
// export enum PlaybackState {
// 	NOT_PLAYING,
// 	WAITING,
// 	PLAYING,
// }
// export enum PlayAction {
// 	PLAY,
// 	PAUSE,
// 	FF,
// 	RWD,
// 	SKIP,
// }
// export function MediaControlCard({
// 	info: { title, subtitle, mediaUrl, image, imageTitle },
// 	btnClicked,
// }: CardProps) {
// 	const classes = useStyles();
// 	const theme = useTheme();
// 	const [playing, setPlaying] = useState(PlaybackState.NOT_PLAYING);
// 	return (
// 		<Card className={classes.root}>
// 			<div className={classes.details}>
// 				<CardContent className={classes.content}>
// 					<Typography component="h5" variant="h5">
// 						{title}
// 					</Typography>
// 					<Typography variant="subtitle1" color="textSecondary">
// 						{subtitle}
// 					</Typography>
// 				</CardContent>
// 				<div className={classes.controls}>
// 					<IconButton aria-label="previous">
// 						<SkipPreviousIcon
// 							onClick={() => {
// 								setPlaying(PlaybackState.NOT_PLAYING);
// 								btnClicked(mediaUrl, PlayAction.PAUSE);
// 							}}
// 						/>
// 					</IconButton>
// 					<IconButton aria-label="play/pause">
// 						{playing ? (
// 							<Pause
// 								onClick={() => {
// 									setPlaying(PlaybackState.NOT_PLAYING);
// 									btnClicked(mediaUrl, PlayAction.PAUSE);
// 								}}
// 								className={classes.playIcon}
// 							/>
// 						) : (
// 							<PlayArrowIcon
// 								onClick={() => {
// 									setPlaying(PlaybackState.WAITING);
// 									btnClicked(mediaUrl, PlayAction.PLAY);
// 								}}
// 								className={classes.playIcon}
// 							/>
// 						)}
// 					</IconButton>
// 					<IconButton aria-label="next">
// 						<SkipNextIcon />
// 					</IconButton>
// 				</div>
// 			</div>
// 			<CardMedia
// 				className={classes.cover}
// 				image={image}
// 				title={imageTitle}
// 			/>
// 		</Card>
// 	);
// }
