// import React, { useCallback, useState } from "react";
// import { makeStyles, useTheme } from "@material-ui/core/styles";
// import AppBar from "@material-ui/core/AppBar";
// import Toolbar from "@material-ui/core/Toolbar";
// import Typography from "@material-ui/core/Typography";
// import Button from "@material-ui/core/Button";
// import IconButton from "@material-ui/core/IconButton";
// import MenuIcon from "@material-ui/icons/Menu";
// import { renderToNodeStream, renderToString } from "react-dom/server";
// import { hydrate } from "react-dom";
// import Container from "@material-ui/core/Container";
// import GridListTile from "@material-ui/core/GridListTile";
// import GridListTileBar from "@material-ui/core/GridListTileBar";
// import ListSubheader from "@material-ui/core/ListSubheader";
// import Info from "@material-ui/icons/Info";
// import GridList from "@material-ui/core/GridList";
// import Card from "@material-ui/core/Card";
// import CardContent from "@material-ui/core/CardContent";
// import CardMedia from "@material-ui/core/CardMedia";
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

// const useStyles2 = makeStyles((theme) => ({
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
// 	const classes = useStyles2();
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

// const useStyles = makeStyles((theme) => ({
// 	root: {
// 		flexGrow: 1,
// 	},
// 	menuButton: {
// 		marginRight: theme.spacing(2),
// 	},
// 	title: {
// 		flexGrow: 1,
// 	},
// }));

// export function App(props) {
// 	const files = props.files || [];
// 	const classes = useStyles();
// 	const btnClick = useCallback(
// 		({ mediaUrl, cmd }) => {
// 			postMessage(cmd, mediaUrl);
// 		},
// 		[files]
// 	);
// 	return (
// 		<div className={classes.root}>
// 			<AppBar position="static">
// 				<Toolbar>
// 					<IconButton
// 						edge="start"
// 						className={classes.menuButton}
// 						color="inherit"
// 						aria-label="menu"
// 					>
// 						<MenuIcon />
// 					</IconButton>
// 					<Typography variant="h6" className={classes.title}>
// 						Welcome
// 					</Typography>
// 					<Button color="inherit">Compose</Button>
// 				</Toolbar>
// 			</AppBar>
// 			<Container fixed>
// 				<Typography
// 					component="div"
// 					style={{ backgroundColor: "#cfe8fc", height: "100vh" }}
// 				/>
// 				<TitlebarGridList
// 					gridTitle={"Hello"}
// 					gridSubTitle={"nov"}
// 					cardsInfo={files}
// 				/>
// 			</Container>
// 		</div>
// 	);
// }

// export type GridListInfo = {
// 	gridTitle: string;
// 	gridSubTitle: string;
// 	cardsInfo: CardInfo[];
// };
// export function TitlebarGridList({
// 	gridTitle,
// 	gridSubTitle,
// 	cardsInfo,
// }: GridListInfo) {
// 	const useStyles = makeStyles((theme) => ({
// 		root: {
// 			display: "flex",
// 			flexWrap: "wrap",
// 			justifyContent: "space-around",
// 			overflow: "hidden",
// 			backgroundColor: theme.palette.background.paper,
// 		},
// 		gridList: {
// 			width: 500,
// 			height: 450,
// 		},
// 		icon: {
// 			color: "rgba(255, 255, 255, 0.54)",
// 		},
// 	}));
// 	const classes = useStyles();

// 	return (
// 		<div className={classes.root}>
// 			<GridList cellHeight={180} className={classes.gridList}>
// 				<GridListTile
// 					key="Subheader"
// 					cols={2}
// 					style={{ height: "auto" }}
// 				>
// 					<ListSubheader component="div">
// 						{gridSubTitle}
// 					</ListSubheader>
// 				</GridListTile>
// 				{cardsInfo.map((info, index) => (
// 					<GridListTile key={info.tileImage + index}>
// 						<MediaControlCard
// 							info={info}
// 							btnClicked={(url, cmd) => {}}
// 						/>
// 					</GridListTile>
// 				))}
// 			</GridList>
// 		</div>
// 	);
// }
// export function renderApp(files) {
// 	return renderToString(<App files={files} />);
// }
// export function rehydrate(files, divid) {
// 	return hydrate(<App />, document.getElementById(divid));
// }
// export function render(files, divid) {
// 	render(<App />, document.getElementById(divid));
// }
