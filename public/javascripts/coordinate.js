$(function() {
  $('#trainer').each(function() {
    var $trainer = $(this);
    var $board = $trainer.find('.lichess_board');
    var $side = $trainer.find('> .side');
    var $right = $trainer.find('> .right');
    var $bar = $trainer.find('.progress_bar');
    var $coords = [
      $trainer.find('#next_coord0').disableSelection(),
      $trainer.find('#next_coord1').disableSelection(),
      $trainer.find('#next_coord2').disableSelection()
    ];
    var $start = $right.find('.start');
    var $explanation = $right.find('.explanation');
    var $score = $trainer.find('.score_container strong');
    var scoreUrl = $trainer.data('score-url');
    var colorUrl = $trainer.data('color-url');
    var duration = 30 * 1000;
    var tickDelay = 50;
    var colorPref = $trainer.data('color-pref');
    var color;
    var startAt, score;

    $trainer.find('.buttons').buttonset().disableSelection();

    var showColor = function() {
      color = colorPref == 'random' ? ['white', 'black'][_.random(0, 1)] : colorPref;
      $trainer.removeClass('white black').addClass(color);
    };
    showColor();

    $trainer.find('form.color').on('click', 'input', function() {
      var c = {
        1: 'white',
        2: 'random',
        3: 'black'
      }[$(this).val()];
      if (colorUrl && c != colorPref) $.ajax({
        url: colorUrl,
        method: 'post',
        data: {
          color: $(this).val()
        }
      });
      colorPref = c;
      showColor();
      return false;
    });

    var showCharts = function() {
      var dark = $('body').hasClass('dark');
      var theme = {
        type: 'line',
        width: '213px',
        height: '80px',
        lineColor: dark ? '#4444ff' : '#0000ff',
        fillColor: dark ? '#222255' : '#ccccff'
      };
      $side.find('.user_chart').each(function() {
        $(this).sparkline($(this).data('points'), theme);
      });
    };
    showCharts();

    var centerRight = function() {
      $right.css('top', (256 - $right.height() / 2) + 'px');
    };
    centerRight();

    var clearCoords = function() {
      $.each($coords, function(i, e) {
        e.text('');
      });
    };

    var newCoord = function(prevCoord) {
      // disallow the previous coordinate's row or file from being selected
      var files = 'abcdefgh';
      var fileIndex = files.indexOf(prevCoord[0]);
      files = files.slice(0, fileIndex) + files.slice(fileIndex + 1, 8);

      var rows = '12345678';
      var rowIndex = rows.indexOf(prevCoord[1]);
      rows = rows.slice(0, rowIndex) + rows.slice(rowIndex + 1, 8);

      return files[_.random(0, files.length - 1)] + rows[_.random(0, rows.length - 1)];
    };

    var advanceCoords = function() {
      $coords[0].removeClass('nope');
      var lastElement = $coords.shift();
      $.each($coords, function(i, e) {
        e.attr('id', 'next_coord' + i);
      });
      lastElement.attr('id', 'next_coord' + ($coords.length));
      lastElement.text(newCoord($coords[$coords.length - 1].text()));
      $coords.push(lastElement);
    };

    var stop = function() {
      clearCoords();
      $trainer.removeClass('play');
      centerRight();
      $trainer.removeClass('wrong');
      $board.off('click', '.lcs');
      if (scoreUrl) $.ajax({
        url: scoreUrl,
        method: 'post',
        data: {
          color: color,
          score: score
        },
        success: function(charts) {
          $side.find('.scores').html(charts);
          showCharts();
        }
      });
    };

    var tick = function() {
      var spent = Math.min(duration, (new Date() - startAt));
      $bar.css('width', (100 * spent / duration) + '%');
      if (spent < duration) setTimeout(tick, tickDelay);
      else stop();
    };

    $score.click(function() {
      $start.filter(':visible').click();
    });

    $start.click(function() {
      $explanation.remove();
      $trainer.addClass('play').removeClass('init');
      showColor();
      clearCoords();
      centerRight();
      score = 0;
      $score.text(score);
      $bar.css('width', 0);
      setTimeout(function() {
        startAt = new Date();
        $board.on('click', '.lcs', function() {
          var hit = this.id == $coords[0].text();
          if (hit) {
            score++;
            $score.text(score);
            advanceCoords();
          } else {
            $coords[0].addClass('nope');
            setTimeout(function() {
              $coords[0].removeClass('nope');
            }, 500);
          }
          $trainer.toggleClass('wrong', !hit);
        });
        $coords[0].text(newCoord('a1'));
        for (i = 1; i < $coords.length; i++)
          $coords[i].text(newCoord($coords[i - 1].text()));
        tick();
      }, 1000);
    });
  });
});
