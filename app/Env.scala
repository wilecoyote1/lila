package lila.app

import akka.actor._
import com.typesafe.config.Config

final class Env(
    config: Config,
    system: ActorSystem,
    appPath: String) {

  val CliUsername = config getString "cli.username"

  private val RendererName = config getString "app.renderer.name"
  private val RouterName = config getString "app.router.name"
  private val WebPath = config getString "app.web_path"

  lazy val bus = lila.common.Bus(system)

  lazy val preloader = new mashup.Preload(
    lobby = Env.lobby.lobby,
    history = Env.lobby.history,
    featured = Env.tv.featured,
    relations = Env.relation.api,
    leaderboard = Env.user.cached.topRatingDay.apply,
    tourneyWinners = Env.tournament.winners.scheduled,
    timelineEntries = Env.timeline.getter.userEntries _,
    nowPlaying = Env.round.nowPlaying,
    dailyPuzzle = Env.puzzle.daily,
    streamsOnAir = () => Env.tv.streamsOnAir,
    getPools = () => Env.pool.repo.all apply true)

  lazy val userInfo = mashup.UserInfo(
    countUsers = () => Env.user.countEnabled,
    bookmarkApi = Env.bookmark.api,
    relationApi = Env.relation.api,
    gameCached = Env.game.cached,
    crosstableApi = Env.game.crosstableApi,
    postApi = Env.forum.postApi,
    getRatingChart = Env.user.ratingChart,
    getRank = Env.user.ranking.get,
    getDonated = Env.donation.api.donatedByUser) _

  system.actorOf(Props(new actor.Renderer), name = RendererName)

  system.actorOf(Props(new actor.Router(
    baseUrl = Env.api.Net.BaseUrl,
    protocol = Env.api.Net.Protocol,
    domain = Env.api.Net.Domain
  )), name = RouterName)

  if (!Env.ai.ServerOnly) {
    loginfo("[boot] Preloading modules")
    List(Env.socket,
      Env.site,
      Env.tournament,
      Env.lobby,
      Env.game,
      Env.setup,
      Env.round,
      Env.team,
      Env.message,
      Env.timeline,
      Env.gameSearch,
      Env.teamSearch,
      Env.forumSearch,
      Env.relation,
      Env.report,
      Env.notification,
      Env.bookmark,
      Env.pref,
      Env.evaluation,
      Env.chat,
      Env.puzzle,
      Env.tv,
      Env.blog)
    loginfo("[boot] Preloading complete")
  }

  if (Env.ai.ServerOnly) println("Running as AI server")

  // if (config getBoolean "simulation.enabled") {
  //   lila.simulation.Env.current.start
  // }
}

object Env {

  lazy val current = "[boot] app" describes new Env(
    config = lila.common.PlayApp.loadConfig,
    system = lila.common.PlayApp.system,
    appPath = lila.common.PlayApp withApp (_.path.getCanonicalPath))

  def api = lila.api.Env.current
  def db = lila.db.Env.current
  def user = lila.user.Env.current
  def security = lila.security.Env.current
  def wiki = lila.wiki.Env.current
  def hub = lila.hub.Env.current
  def socket = lila.socket.Env.current
  def message = lila.message.Env.current
  def notification = lila.notification.Env.current
  def i18n = lila.i18n.Env.current
  def game = lila.game.Env.current
  def bookmark = lila.bookmark.Env.current
  def search = lila.search.Env.current
  def gameSearch = lila.gameSearch.Env.current
  def timeline = lila.timeline.Env.current
  def forum = lila.forum.Env.current
  def forumSearch = lila.forumSearch.Env.current
  def team = lila.team.Env.current
  def teamSearch = lila.teamSearch.Env.current
  def ai = lila.ai.Env.current
  def analyse = lila.analyse.Env.current
  def mod = lila.mod.Env.current
  def monitor = lila.monitor.Env.current
  def site = lila.site.Env.current
  def round = lila.round.Env.current
  def lobby = lila.lobby.Env.current
  def setup = lila.setup.Env.current
  def importer = lila.importer.Env.current
  def tournament = lila.tournament.Env.current
  def relation = lila.relation.Env.current
  def report = lila.report.Env.current
  def pref = lila.pref.Env.current
  def evaluation = lila.evaluation.Env.current
  def chat = lila.chat.Env.current
  def puzzle = lila.puzzle.Env.current
  def coordinate = lila.coordinate.Env.current
  def tv = lila.tv.Env.current
  def blog = lila.blog.Env.current
  def pool = lila.pool.Env.current
  def donation = lila.donation.Env.current
  def qa = lila.qa.Env.current
}
