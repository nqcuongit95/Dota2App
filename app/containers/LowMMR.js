import React, { Component } from "react";
import ScreenTypes from "../navigators/ScreenTypes";
import { NavigationBarWithMatchSearch } from "../components/NavigationBar";
import { View } from "@shoutem/ui";
import { connectStyle } from "@shoutem/theme";
import { connect } from "react-redux";
import { bindActionCreators } from "redux";
import { splitStringToInt } from "../utils/utilsFunction";
import { getHeroImage } from "../utils/getHeroImage";
import lobbyTypes from "dotaconstants/build/lobby_type.json";
import gameModes from "dotaconstants/build/game_mode.json";
import PublicMatchRow, {
  PUBLIC_MATCH_ROW_HEIGHT
} from "../components/PublicMatchRow";
import { FlatList } from "react-native";
import * as lowMMRMatchAction from "../actions/LowMMRMatchAction";
import { createGroupedArray } from "../utils/utilsFunction";
import { Pages } from "react-native-pages";
import Loading from "../components/Loading";
import moment from "moment";
import themeColors from "../themes/colors";
import Pagination from "../components/Pagination";
import { navigateToMenuScreen } from "../actions/NavigationAction";

class LowMMR extends Component {
  constructor(props) {
    super(props);

    this.state = {
      lowMMRMatches: [],
      currentPageIndex: 0
    };

    this.renderItem = this.renderItem.bind(this);
    this.fetchingData = this.fetchingData.bind(this);
    this.onRefreshing = this.fetchingData.bind(this, true);
    this.normalizeGameMode = this.normalizeGameMode.bind(this);
    this.normalizeLobbyType = this.normalizeLobbyType.bind(this);
    this.onPage = this.onPage.bind(this);
    this.renderFooter = this.renderFooter.bind(this);
    this.keyExtractor = this.keyExtractor.bind(this);
    this.onItemPress = this.onItemPress.bind(this);
    this.getItemLayout = this.getItemLayout.bind(this);
  }

  componentWillReceiveProps(nextProps) {
    if (
      this.props.lowMMRMatches != nextProps.lowMMRMatches &&
      nextProps.lowMMRMatches.length > 0
    ) {
      let processedMatches = this.processLowMMRMatchesData(
        nextProps.lowMMRMatches
      );

      let lowMMRMatches = createGroupedArray(processedMatches, 25);

      this.setState({ lowMMRMatches: lowMMRMatches });
    }
  }

  componentDidMount() {
    this.fetchingData();
  }

  fetchingData(refreshing = false) {
    this.props.actions.fetchLowMMRMatches(refreshing);
  }

  normalizeGameMode(gameMode) {
    var trimmed = gameMode.replace("game_mode_", "");
    var split = trimmed.split("_");
    var normalized = "";
    for (var i = 0; i < split.length; i++) {
      split[i][0].toUpperCase();
      normalized += split[i].charAt(0).toUpperCase() + split[i].slice(1) + " ";
    }
    return normalized;
  }

  normalizeLobbyType(lobbyType) {
    var trimmed = lobbyType.replace("lobby_type_", "");
    var split = trimmed.split("_");
    var normalized = "";
    for (var i = 0; i < split.length; i++) {
      split[i][0].toUpperCase();
      normalized += split[i].charAt(0).toUpperCase() + split[i].slice(1) + " ";
    }
    return normalized;
  }

  processLowMMRMatchesData(matches) {
    let processedData = [];

    for (let i = 0; i < matches.length; i++) {
      let processedMatch = {};

      processedMatch.matchId = matches[i].match_id;
      //use as key for flatlist
      processedMatch.key = matches[i].match_id;

      let duration = moment("1900-01-01 00:00:00")
        .add(matches[i].duration, "seconds")
        .format("HH:mm:ss");
      processedMatch.formattedDuration = duration;
      let friendlyEndedTime = moment.unix(matches[i].start_time).fromNow();
      processedMatch.endedTime = friendlyEndedTime;

      let radiantHerosId = splitStringToInt(matches[i].radiant_team, ",");
      for (let i = 0; i < radiantHerosId.length; i++) {
        processedMatch["radiantSlot_" + i] = getHeroImage(radiantHerosId[i]);
      }

      let direHerosId = splitStringToInt(matches[i].dire_team, ",");

      for (let i = 0; i < direHerosId.length; i++) {
        processedMatch["direSlot_" + i] = getHeroImage(direHerosId[i]);
      }

      processedMatch.averageMMR = matches[i].avg_mmr;
      processedMatch.gameMode = this.normalizeGameMode(
        gameModes[matches[i].game_mode].name
      );
      processedMatch.lobbyType = this.normalizeLobbyType(
        lobbyTypes[matches[i].lobby_type].name
      );
      processedMatch.averageRankTier = matches[i].avg_rank_tier;

      processedMatch.radiantWin = matches[i].radiant_win;

      processedData[i] = processedMatch;
    }

    return processedData;
  }

  onItemPress(matchId) {
    this.props.navigation.dispatch(
      navigateToMenuScreen(ScreenTypes.MatchDetail, { matchId: matchId })
    );
  }

  renderItem({ item, index }) {
    return (
      <PublicMatchRow
        match={item}
        index={index}
        onPress={() => this.onItemPress(item.matchId)}
      />
    );
  }

  getItemLayout(data, index) {
    return {
      offset: PUBLIC_MATCH_ROW_HEIGHT * index,
      length: PUBLIC_MATCH_ROW_HEIGHT,
      index
    };
  }

  onRefresh() {}

  onPage(index) {
    this.setState({ currentPageIndex: index });
  }

  renderFooter() {
    const { currentPageIndex } = this.state;
    const totalPages = this.state.lowMMRMatches.length;

    return (
      <Pagination
        totalPages={totalPages}
        currentIndex={currentPageIndex}
        numberPagesShow={5}
        onPage={this.onPage}
      />
    );
  }

  keyExtractor(item, index) {
    return item.matchId;
  }

  render() {
    const styles = this.props.style;
    const { navigation } = this.props;
    const { isLoadingLowMMRMatches, isRefreshingLowMMRMatches } = this.props;
    const { currentPageIndex, lowMMRMatches } = this.state;

    let content = <View />;

    if (isLoadingLowMMRMatches) {
      content = <Loading />;
    } else if (lowMMRMatches.length > 0) {
      content = (
        <FlatList
          style={styles.container}
          data={this.state.lowMMRMatches[currentPageIndex]}
          renderItem={this.renderItem}
          getItemLayout={this.getItemLayout}
          refreshing={isRefreshingLowMMRMatches}
          onRefresh={this.onRefreshing}
          ListFooterComponent={this.renderFooter}
          keyExtractor={this.keyExtractor}
          initialNumToRender={4}
        />
      );
    }

    return <View styleName="fill-parent dota2">{content}</View>;
  }
}

LowMMR.navigationOptions = {
  title: "Low MMR",
  tabBarLabel: "Low MMR"
};

const styles = {
  container: {
    marginLeft: 15,
    marginRight: 15
  }
};

function mapStateToProps(state) {
  return {
    isRefreshingLowMMRMatches:
      state.lowMMRMatchesState.isRefreshingLowMMRMatches,
    isLoadingLowMMRMatches: state.lowMMRMatchesState.isLoadingLowMMRMatches,
    isEmptyLowMMRMatches: state.lowMMRMatchesState.isEmptyLowMMRMatches,
    lowMMRMatches: state.lowMMRMatchesState.lowMMRMatches
  };
}

function mapDispatchToprops(dispatch) {
  return {
    actions: bindActionCreators(lowMMRMatchAction, dispatch)
  };
}

export default connectStyle("dota2app.LowMMRScreen", styles)(
  connect(mapStateToProps, mapDispatchToprops)(LowMMR)
);
